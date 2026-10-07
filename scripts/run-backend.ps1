$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$apiProject = Join-Path $projectRoot 'backend/VocabMate.Api'
$portableStartScript = Join-Path $projectRoot '.local/start-postgres.ps1'
if (Test-Path $portableStartScript) { & $portableStartScript }
if (-not $env:ASPNETCORE_ENVIRONMENT) { $env:ASPNETCORE_ENVIRONMENT = 'Development' }
Push-Location $projectRoot
try {
    & dotnet run --project $apiProject --no-launch-profile --urls http://localhost:5080
    if ($LASTEXITCODE -ne 0) { throw 'Backend exited with an error.' }
} finally { Pop-Location }
