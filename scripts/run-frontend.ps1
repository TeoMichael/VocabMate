$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$frontendPath = Join-Path $projectRoot 'frontend'
$npmCommand = Get-Command npm.cmd,npm -ErrorAction SilentlyContinue | Select-Object -First 1
$localNpm = Join-Path $projectRoot '.local/npm/package/bin/npm-cli.js'
Push-Location $frontendPath
try {
    if ($npmCommand) {
        & $npmCommand.Source run dev -- --host localhost
    } elseif (Test-Path $localNpm) {
        & node $localNpm run dev -- --host localhost
    } else {
        throw 'npm was not found. Install Node.js 22.12 or newer with npm, then run npm ci in frontend.'
    }
    if ($LASTEXITCODE -ne 0) { throw 'Frontend exited with an error.' }
} finally { Pop-Location }
