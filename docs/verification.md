# MVP verification

Development verification on October 7, 2026 used .NET 8, Node 24, and a workspace-local PostgreSQL 18.6 server. No application data is seeded in the repository.

## Backend

- `dotnet build backend/VocabMate.sln`: passed, zero warnings/errors.
- `dotnet test backend/VocabMate.sln`: 44 passed, zero failed/skipped.
- Tests cover password hashing/login/JWT, vocabulary and topic ownership/CRUD/import, normalization, mastery, weak selection, question scoring, answer replay/concurrency, weekly ordering/unlock/resume, and deleted-word history/daily counts.
- Automated tests use isolated SQLite databases. Actual PostgreSQL migrations and requests were verified separately.
- `InitialCreate` and `PreserveReviewIdentity` migrations were applied to PostgreSQL.
- Real PostgreSQL HTTP checks: 179 assertions passed (157 checks in `scripts/smoke-api.ps1`, plus 22 local weekly-fixture checks). The fixture changed registration time only on a newly created verification account to exercise the seven-day unlock without waiting.
- Both API verification accounts and their data were removed after checks.
- NuGet vulnerability check reported no vulnerable API packages, including transitive dependencies.

## Frontend and delivery

Final frontend build, lint, browser checks, and GitHub verification are recorded when complete in the milestone task list.

## Secrets

The ignored local PostgreSQL connection string, password, and JWT key were checked against project files and Git commit history. No matches were found. Local tools, database files, build outputs, dependencies, and development settings are ignored.
