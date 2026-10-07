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

## Browser verification

The application was exercised against the running API and PostgreSQL database:

- Account registration, topic creation, bulk import with an invalid line, vocabulary editing, and search.
- Logout and login restore the persisted library and learning progress.
- Flashcard reveal/self-assessment, multiple choice, fill meaning, and reverse quiz.
- Weak-word detection and focused practice.
- Weekly review with six questions and a result of 5/6. Mistake review displayed `travel` → `du lịch`, and the next review availability advanced to October 14, 2026.
- A 390-pixel mobile viewport; detected horizontal overflow was corrected and checked again.

Screenshots are saved in `docs/screenshots/`. The browser verification account was removed after testing; screenshots show actual persisted test data, with no shared demo account seeded.

## Final checks and delivery

- Final frontend `npm run build`: passed.
- Final frontend `npm run lint` (oxlint): passed.
- Final frontend `npm run format:check` (Prettier): passed.
- Final backend Release build: passed, zero warnings/errors.
- Final backend test rerun: 44 passed, zero failed/skipped.
- Clean isolated `npm ci` using the current `package-lock.json`: passed, zero vulnerabilities reported.
- GitHub: created [TeoMichael/VocabMate](https://github.com/TeoMichael/VocabMate) as a private personal repository, pushed `main`, and verified the GitHub commit SHA matched local HEAD.

## Secrets

The ignored local PostgreSQL connection string, password, and JWT key were checked against project files and Git commit history. No matches were found. Local tools, database files, build outputs, dependencies, and development settings are ignored.
