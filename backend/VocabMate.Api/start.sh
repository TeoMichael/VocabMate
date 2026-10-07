#!/bin/sh
set -eu

# The hosting dashboard enables this command only for a reviewed migration deploy.
if [ "${1:-}" = "--migrate" ]; then
    dotnet VocabMate.Api.dll --migrate
fi

exec dotnet VocabMate.Api.dll --urls "http://0.0.0.0:${PORT:-8080}"
