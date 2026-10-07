# VocabMate v1.0.0 release verification

Final readiness checks ran on October 7, 2026 against the existing repository and approved vibrant interface. Baseline checks were run before changes: 47 backend tests, frontend clean install/build/lint/format, 179 PostgreSQL assertions, and 11 setup assertions passed. This document records the subsequent release fixes and final evidence; [verification.md](verification.md) retains the earlier work.

## Confirmed fixes

- Reproduced ambiguous multiple choice when a distractor shared an accepted slash/semicolon alias with the solution. Four regression cases failed before the fix. Question generation now excludes overlapping normalized aliases and falls back to fill meaning when no valid distractor remains.
- Reproduced an unwanted login redirect when the API was unavailable during the initial account check. Network failure now preserves an unexpired local session; pages offer retry. Actual 401 responses still clear authentication. Stopping/restarting the live API confirmed failure and recovery in the production frontend.
- Date-only UTC statistics buckets now retain their date in western timezones. A regression test uses America/Los_Angeles; event timestamps still display locally.
- Added visible 00:00 UTC daily reset copy, auth-page main/H1 semantics, column header scopes, post-answer button focus, invalid-edit navigation, and topic-list retry.
- Closed topic dialogs no longer fetch topic data. Topic labels and notifications handle maximum-length content without squeezing actions. Form/dialog accents follow the approved dashboard.
- NuGet audit found three vulnerable transitive test packages. Updating xUnit and explicitly selecting SQLitePCLRaw bundle 3.0.5 removed them; the API uses PostgreSQL and did not include these test-only dependencies. The resolved solution audit now reports no vulnerable packages. Upstream references: [SQLite advisory](https://github.com/advisories/GHSA-2m69-gcr7-jv3q), [HTTP advisory](https://github.com/advisories/GHSA-7jgj-8wvc-jh57), [Regex advisory](https://github.com/advisories/GHSA-cmhx-cq75-c4mj), and [maintainer package](https://www.nuget.org/packages/SQLitePCLRaw.bundle_e_sqlite3/3.0.5).

## Final automated checks

| Command / check                                                                     | Actual result                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `dotnet restore backend/VocabMate.sln`                                              | Passed                                                                      |
| `dotnet build backend/VocabMate.sln --no-restore`                                   | Debug: 0 warnings, 0 errors                                                 |
| `dotnet test backend/VocabMate.sln --no-build --no-restore`                         | Debug: 59 passed, 0 failed, 0 skipped                                       |
| `dotnet build backend/VocabMate.sln --configuration Release --no-restore`           | Release: 0 warnings, 0 errors                                               |
| `dotnet test backend/VocabMate.sln --configuration Release --no-build --no-restore` | Release: 59 passed, 0 failed, 0 skipped                                     |
| `dotnet list backend/VocabMate.sln package --vulnerable --include-transitive`       | No vulnerable packages reported for API or tests                            |
| Frontend `npm ci`                                                                   | 77 packages installed, 78 audited, 0 vulnerabilities                        |
| Frontend `npm run build`                                                            | TypeScript/Vite production build passed                                     |
| Frontend `npm run test`                                                             | 2 passed, 0 failed/skipped                                                  |
| Frontend `npm run lint`                                                             | Passed                                                                      |
| Frontend `npm run format:check`                                                     | Passed                                                                      |
| Real PostgreSQL HTTP checks on rebuilt Release API                                  | 179 assertions: 157 committed smoke checks + 22 local weekly-fixture checks |
| Startup/configuration helper checks                                                 | 11 passed; Docker output stubbed                                            |

System npm is absent, so npm commands used the ignored portable npm CLI through Node with the committed lockfile. No additional frontend dependencies were introduced. NuGet checks used its official feed. Vulnerability audits report the feed's known advisories at check time; they are not a guarantee against all vulnerabilities.

Backend regression tests cover authentication/validation, owned CRUD/import/topics, deterministic mastery/weak detection, answer normalization/scoring, replay/concurrency, weekly ordering/eligibility/resume, deleted-word snapshots, UTC midnight and goals over ten, finite empty statistics, and generic 500 ProblemDetails without private exception data. Added JWT cases reject expiry, future validity, wrong issuer/audience, and malformed identity. SQLite isolates automated tests; PostgreSQL verifies provider-specific behavior separately.

## Fresh database evidence

A separate empty PostgreSQL development database was created without changing the retained presentation database. Both committed migrations applied from zero, in order:

1. `20261007023911_InitialCreate`
2. `20261007024137_PreserveReviewIdentity`

The resulting migration history contained both entries and zero users before verification. Running database update again reported already up to date. `dotnet ef migrations has-pending-model-changes` reported no model changes. No migration or schema alteration was required for this release.

The fresh migrated database passed registration/login, topics, vocabulary CRUD/import, ownership, practice/reveal/answer, progress, history, and statistics checks. The local weekly fixture backdated only its newly created verification account, checked active-session identity and cooldown, and removed both smoke accounts afterward. The separately generated browser account remains only in this isolated development database for inspection. All credentials, SQL fixture files, database files, and tools are ignored.

## Actual browser checks

The production frontend ran with the real Release API and PostgreSQL; no mocks supplied any page:

- Register a fresh account, log out, visit a protected page, reject a wrong password, log back in, and return to the requested vocabulary page with persistent data.
- Empty dashboard, vocabulary, Weak Words, statistics, and weekly lock; finite zero values and actionable states.
- Create/rename a topic, reject its case-insensitive duplicate, delete a newly created disposable empty topic through confirmation, and disable deletion of the populated topic. Escape restores dialog opener focus.
- Add/edit Vietnamese vocabulary and an example, assign a topic, combine search/topic/mastery filters, show empty results, and import valid/blank/extra-space/invalid lines. Five valid entries persisted and original line 5 remained for correction.
- Create a 120-character unbroken word with a 500-character Vietnamese meaning. Cards and edit/confirmation UI fit at 320px; the disposable word was deleted through confirmation.
- Flashcard meaning hidden before reveal, keyboard reveal and self-assessment, green/rose feedback, and post-answer focus. Server rejection of replay/competing submissions is covered by automated/live API checks.
- Multiple choice with exactly one solution among distinct owned saved meanings; fill meaning and reverse with uppercase and extra spaces; all four modes completed.
- Leave/resume/reload regular practice after one answer; resume at word 2. Completed sessions disappear from unfinished history.
- Two misses move a word into Weak Words; three subsequent correct focused answers remove it. Focused sessions contained only the qualifying word.
- Fresh weekly lock, then ready state using only the isolated account's eight-day registration fixture. Six distinct questions mixed multiple choice/fill/reverse. Leave/resume/reload restored word 2. Finish at 5/6 (83% rounded), inspect the saved `travel` mistake, reopen results, and see the next seven-day availability. Automated tests additionally verify concurrent starts, duplicate answer rejection, and deleted-library resume.
- Statistics reflected nine completed sessions, 22 correct/4 missed answers (84.6%), six distinct daily words, and matching mastery before the later goal test. An additional eleven-word flashcard session exercised three mastered words and a full goal ring at 11/10; earlier browser states exercised 0/10 and 6/10.
- Missing quiz/vocabulary IDs show friendly retry/back navigation. Real API outage/recovery preserves a valid login; an invalid JWT after switching databases returns to login. Generic unexpected server error privacy is tested automatically rather than injecting a production failure endpoint.

At 320, 390, 820, 1280, and 1440px, document scroll width equaled client width on dashboard, vocabulary, add form, practice selection, Weak Words, weekly review, statistics, weekly results, login, and registration. Mobile active questions, topic/import/delete dialogs, edit forms, and long content were also inspected. Login/registration labels, main landmark/H1, mobile drawer focus/close behavior, keyboard answers, column scopes, and shared focus/disabled states were checked. Existing vibrant palette contrast checks are recorded in the earlier audit. This targeted pass is not formal accessibility certification.

## Security, performance, and repository hygiene

Ownership queries and composite foreign keys were reviewed; automated and live checks reject foreign-user vocabulary, topic assignment, quiz access, answers, and reveals. Password hashing, issuer/audience/signature/lifetime JWT validation, input limits, CORS configuration, central ProblemDetails, and 401 handling were inspected and tested. No new public debugging/demo endpoint was added.

Before delivery, local JWT/database/demo/test-account secret values were checked against every nonignored text file and every Git revision. Tracked files were inspected for common credential patterns and prohibited artifacts. `.env`, local database/configuration, development appsettings, demo credentials, build outputs, and dependency directories remain ignored. Scans do not constitute an independent penetration test.

Performance review found an unnecessary topic fetch while its dialog was closed, which was removed. Queries scope ownership and load related progress in batches; history is bounded to 50 sessions. The final frontend bundle is about 397 kB JS (124 kB gzip) and 70 kB CSS (14 kB gzip), with no build warnings. No load benchmark was performed. Full-library vocabulary queries remain a documented student-scale limit.

## Demo, delivery, and limits

The retained Mia Nguyen presentation account and its original learning data were preserved. Dashboard/statistics screenshots reflect the release's UTC copy; the existing gallery retains the approved vibrant interface. [Demo guide](demo-guide.md) covers the complete presentation and a separate local rehearsal database for immediate weekly eligibility. No shared credentials are seeded in clones.

Release readiness covers the local university-project scope. Remaining limits: eight-hour JWTs without refresh/revocation, UTC day boundaries, unpaginated personal libraries, deterministic alias matching/self-assessed flashcards, and production deployment/HTTPS/rate limiting/backups/monitoring still to configure. Docker was inspected and stub-tested, but actual Docker startup was unavailable; real PostgreSQL was tested instead.

GitHub delivery uses the existing private repository and main branch, without overwriting history. The final release commit is tagged `v1.0.0` only after a clean working tree and passing checks. Delivery hashes, remote verification, and the GitHub Release URL are reported after publication.
