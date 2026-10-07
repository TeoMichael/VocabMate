param([switch]$UseDocker)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$settingsPath = Join-Path $projectRoot 'backend/VocabMate.Api/appsettings.Development.json'

$settings = [pscustomobject]@{}
if (Test-Path $settingsPath) {
    try { $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json }
    catch { throw 'Existing development settings are invalid JSON. Correct that file before running setup.' }
}

$connectionString = $settings.ConnectionStrings.DefaultConnection
$jwtKey = $settings.Jwt.Key
if ($jwtKey -and [Text.Encoding]::UTF8.GetByteCount($jwtKey) -lt 32) {
    throw 'The existing JWT key must contain at least 32 bytes. Correct the ignored development settings before running setup.'
}
if ($connectionString -and $jwtKey -and $settings.Jwt.Issuer -and $settings.Jwt.Audience) {
    Write-Output 'Existing local backend configuration retained.'
    return
}

if (-not $connectionString) { $connectionString = $env:ConnectionStrings__DefaultConnection }
$portableDatabasePath = Join-Path $projectRoot '.local/database.json'
if (-not $connectionString -and -not $UseDocker -and (Test-Path $portableDatabasePath)) {
    $connectionString = (Get-Content $portableDatabasePath -Raw | ConvertFrom-Json).ConnectionString
}

if (-not $connectionString -and $UseDocker) {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI is required for -UseDocker. Install Docker, or set ConnectionStrings__DefaultConnection for your existing database.'
    }
    # Compose resolves .env interpolation, quotes, comments, and shell overrides.
    # Capture the result in memory because its environment values contain secrets.
    $composeJson = & docker compose --project-directory $projectRoot config --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose could not resolve database configuration. Check .env and docker-compose.yml.' }
    try { $composeConfiguration = $composeJson | ConvertFrom-Json }
    catch { throw 'Docker Compose did not return valid configuration JSON.' }
    $databaseValues = $composeConfiguration.services.db.environment
    if (-not $databaseValues.POSTGRES_USER -or -not $databaseValues.POSTGRES_PASSWORD) {
        throw 'Fill POSTGRES_USER and POSTGRES_PASSWORD in the ignored root .env file first.'
    }
    $databasePort = @($composeConfiguration.services.db.ports | Where-Object { $_.target -eq 5432 }) | Select-Object -First 1
    if (-not $databasePort.published -or $databasePort.published -notmatch '^\d+$') {
        throw 'Docker Compose must publish one database port for container port 5432. Otherwise set ConnectionStrings__DefaultConnection explicitly.'
    }
    $connectionBuilder = New-Object System.Data.Common.DbConnectionStringBuilder
    $connectionBuilder['Host'] = '127.0.0.1'
    $connectionBuilder['Port'] = [int]$databasePort.published
    $connectionBuilder['Database'] = $databaseValues.POSTGRES_DB
    $connectionBuilder['Username'] = $databaseValues.POSTGRES_USER
    $connectionBuilder['Password'] = $databaseValues.POSTGRES_PASSWORD
    $connectionString = $connectionBuilder.ConnectionString
}

if (-not $connectionString) {
    throw 'Set ConnectionStrings__DefaultConnection, or use -UseDocker after configuring .env. See README.md.'
}

if (-not $jwtKey) {
    $jwtBytes = New-Object byte[] 64
    $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $randomGenerator.GetBytes($jwtBytes) } finally { $randomGenerator.Dispose() }
    $jwtKey = [Convert]::ToBase64String($jwtBytes)
}
foreach ($section in @('ConnectionStrings', 'Jwt')) {
    if (-not $settings.$section) { $settings | Add-Member -NotePropertyName $section -NotePropertyValue ([pscustomobject]@{}) -Force }
}
$settings.ConnectionStrings | Add-Member -NotePropertyName DefaultConnection -NotePropertyValue $connectionString -Force
$settings.Jwt | Add-Member -NotePropertyName Key -NotePropertyValue $jwtKey -Force
if (-not $settings.Jwt.Issuer) { $settings.Jwt | Add-Member -NotePropertyName Issuer -NotePropertyValue 'VocabMate' -Force }
if (-not $settings.Jwt.Audience) { $settings.Jwt | Add-Member -NotePropertyName Audience -NotePropertyValue 'VocabMate.Web' -Force }
if (-not $settings.FrontendUrl) { $settings | Add-Member -NotePropertyName FrontendUrl -NotePropertyValue 'http://localhost:5173' -Force }
$settings | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $settingsPath -Encoding UTF8
Write-Output 'Configured ignored local backend settings. Existing configured values were retained; no secrets were printed.'
