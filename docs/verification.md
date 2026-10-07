# Verification

The existing MVP was audited and polished on October 7, 2026 using .NET 8, Node 24, and workspace-local PostgreSQL 18.6. The application uses the real API; no shared account or mock vocabulary is seeded by the repository.

## Builds and automated checks

Baseline frontend build, lint, and formatting checks passed, as did the backend Release build and 44 tests. Final checks after the fixes:

| Check                                                                               | Result                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------- |
| `dotnet build backend/VocabMate.sln --configuration Release --no-restore`           | Zero warnings/errors                        |
| `dotnet test backend/VocabMate.sln --configuration Release --no-build --no-restore` | 47 passed; zero failed/skipped              |
| Frontend `npm run build`                                                            | TypeScript and Vite production build passed |
| Frontend `npm run lint`                                                             | Passed                                      |
| Frontend `npm run format:check`                                                     | Passed                                      |
| Clean isolated `npm ci` using the committed lockfile                                | Passed; zero vulnerabilities reported       |
| Live PostgreSQL HTTP checks                                                         | 179 assertions passed                       |
| Startup helper checks                                                               | 11 isolated assertions passed               |

System npm is absent here, so frontend checks used npm's portable CLI through Node. Backend restore succeeded using the existing NuGet cache. The earlier MVP NuGet audit reported no vulnerable API packages, including transitive dependencies.

Backend tests use isolated SQLite databases and cover authentication, ownership, topic/vocabulary CRUD/import, normalization, mastery, weak selection, scoring, replay/concurrency, weekly ordering/unlock/resume, and deleted-word history/daily counts. Three audit regression tests cover the 500-nonblank-line import limit, unfinished-session history ownership, and weekly resumption after deleting the live library.

## PostgreSQL and startup helpers

The final EF listing confirmed `20261007023911_InitialCreate` and `20261007024137_PreserveReviewIdentity` are applied. This pass required no new migration.

The updated Release API passed 157 assertions from `scripts/smoke-api.ps1` plus 22 local weekly-fixture checks. Only newly created verification accounts had their registration timestamps changed. The local wrapper removed both accounts afterward; a database count confirmed cleanup. The standalone committed smoke script retains its uniquely named accounts for inspection.

The setup helper passed checks for blank/partial settings, preserving existing configuration, invalid JSON/short JWT rejection, special-character credentials, custom ports, and Compose failure. Docker's resolved configuration output was stub-tested because Docker is unavailable here. Actual container startup remains untested.

After the final build, the Release API restarted successfully. API health and the Vite frontend returned HTTP 200.

## Manual browser checks

The pink interface was exercised against the running API and PostgreSQL:

- Register, log out, visit a protected page, and log in. The fixed login return path restores the requested vocabulary page.
- Create/rename topics, cancel an empty-topic deletion confirmation, and check that used topics cannot be deleted. Actual deletion/ownership restrictions are covered by API tests.
- Import five Vietnamese pairs plus an invalid line and trailing newline. Valid entries persist; the invalid line keeps its original number for correction.
- Add/edit vocabulary, search, filter topics, and see save feedback.
- Complete reverse, flashcard, fill-meaning, and multiple-choice practice, including uppercase, extra spaces, and an alternate saved meaning.
- Leave, resume, and reload a saved session; continue at the first unanswered question.
- Miss a word twice, see it in Words to Review, and practice until it leaves that section.
- Check fresh-account weekly locking. Backdate only the separate local demonstration account to exercise ready/resume states, finish a six-question review with 5/6, inspect the `travel` → `du lịch` mistake, and verify the next availability date.
- Check dashboard totals, daily distinct-word progress, mastery, accuracy, completed history, and vocabulary growth.
- Answer multiple choice at 390px and check feedback and tappable controls.

Desktop (1280px), tablet (820px), and mobile (390px) layouts were inspected. Final 320px checks compared document scroll width with actual client width, including the scrollbar gutter. Dashboard, vocabulary, practice selection, active quiz, weak words, weekly review, statistics, add-word form, and completed results fit without horizontal document overflow. The drawer closes with Escape, restores opener focus, and closes when resized to desktop.

Targeted shared-color checks measured white text on the primary button at 5.21:1. Active navigation text on rose was adjusted to 5.70:1. Visible focus, skip navigation, reduced motion, labels, and drawer keyboard behavior were checked. This is a targeted usability audit, not full accessibility certification.

Screenshots in `docs/screenshots/` show real learning data at different workflow moments; counts can differ between images. A separate local Mia Nguyen account is retained for presentation, with credentials only in ignored `.local/demo-account.json`. Its words and answers were entered through the UI. See [the demo guide](demo-guide.md).

## Vibrant visual refinement

A second visual pass on October 7, 2026 retained the page structure and strengthened the shared palette, tinted surfaces, buttons, sidebar, mastery badges, progress indicators, and learning feedback. Dashboard, vocabulary, authentication, practice, weekly review/results, statistics, and empty states now use the same brighter design. No backend rules, API contracts, dependencies, or migrations changed.

After this pass, the frontend production build, lint, and format check passed. The backend Release build completed with zero warnings/errors, and all 47 backend tests passed again with none skipped. Both local servers restarted, and `/api/health` and the frontend returned HTTP 200. The earlier 179 PostgreSQL assertions and 11 setup-helper assertions belong to the preceding audit; they were not rerun for this visual-only change.

Browser checks used real API data at 1280, 820, 390, and 320-pixel widths. At 320px, dashboard, vocabulary, add-word form, import dialog, practice modes, active multiple choice, weak words, weekly review, completed weekly results, statistics, login, and registration had no horizontal document overflow. The mobile drawer closed with Escape and restored opener focus; resizing to tablet closed the drawer state. A resumed multiple-choice session saved one correct and one missed answer, with green/rose option and feedback states. Flashcard reveal, completed weekly scoring, and mistake review were inspected without changing their business logic.

Targeted color checks measured white text against the primary gradient endpoints at 5.14:1 and 5.89:1, success text on its green fill at 5.71:1, and error text on its rose fill at 5.46:1. Dark secondary text on rose, lavender, and yellow shared fills remains above 4.5:1. These checks do not constitute full accessibility certification.

All 14 existing screenshots were refreshed, with registration and missed-answer feedback added for a 16-image gallery. The images use real demonstration data. This pass did not seed mock vocabulary or alter database timestamps.

## Delivery and secrets

The existing private GitHub repository and history are preserved. Final delivery is tracked in [the polish checklist](polish-checklist.md).

Local PostgreSQL passwords/connection strings, the JWT key, and the generated demo password are checked against nonignored files and Git history before pushing. Local tools, databases, credentials, dependencies, and build outputs are ignored.
