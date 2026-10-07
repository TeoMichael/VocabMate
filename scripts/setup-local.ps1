param([switch]$UseDocker)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$settingsPath = Join-Path $projectRoot 'backend/VocabMate.Api/appsettings.Development.json'

if (Test-Path $settingsPath) {
    Write-Output 'Existing local backend configuration retained.'
    exit 0
}

$connectionString = $env:ConnectionStrings__DefaultConnection
$portableDatabasePath = Join-Path $projectRoot '.local/database.json'
if (-not $connectionString -and -not $UseDocker -and (Test-Path $portableDatabasePath)) {
    $connectionString = (Get-Content $portableDatabasePath -Raw | ConvertFrom-Json).ConnectionString
}

if (-not $connectionString -and $UseDocker) {
    $databaseValues = @{}
    $environmentPath = Join-Path $projectRoot '.env'
    if (Test-Path $environmentPath) {
        foreach ($line in Get-Content $environmentPath) {
            if ($line -match '^\s*(POSTGRES_USER|POSTGRES_PASSWORD)\s*=(.*)$') {
                $databaseValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
            }
        }
    }
    if ($env:POSTGRES_USER) { $databaseValues.POSTGRES_USER = $env:POSTGRES_USER }
    if ($env:POSTGRES_PASSWORD) { $databaseValues.POSTGRES_PASSWORD = $env:POSTGRES_PASSWORD }
    if (-not $databaseValues.POSTGRES_USER -or -not $databaseValues.POSTGRES_PASSWORD) {
        throw 'Fill POSTGRES_USER and POSTGRES_PASSWORD in the ignored root .env file first.'
    }
    $connectionBuilder = New-Object System.Data.Common.DbConnectionStringBuilder
    $connectionBuilder['Host'] = '127.0.0.1'
    $connectionBuilder['Port'] = 5432
    $connectionBuilder['Database'] = 'vocabmate'
    $connectionBuilder['Username'] = $databaseValues.POSTGRES_USER
    $connectionBuilder['Password'] = $databaseValues.POSTGRES_PASSWORD
    $connectionString = $connectionBuilder.ConnectionString
}

if (-not $connectionString) {
    throw 'Set ConnectionStrings__DefaultConnection, or use -UseDocker after configuring .env. See README.md.'
}

$jwtBytes = New-Object byte[] 64
$randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $randomGenerator.GetBytes($jwtBytes) } finally { $randomGenerator.Dispose() }
$settings = [ordered]@{
    ConnectionStrings = @{ DefaultConnection = $connectionString }
    Jwt = @{ Key = [Convert]::ToBase64String($jwtBytes); Issuer = 'VocabMate'; Audience = 'VocabMate.Web' }
    FrontendUrl = 'http://localhost:5173'
}
$settings | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $settingsPath -Encoding UTF8
Write-Output 'Created ignored local backend configuration with a generated JWT signing key. No secrets were printed.'
