# Development milestones

- [x] 1. Foundation: React, API, database configuration, builds and first commit
- [x] 2. Authentication: registration, login, JWT, protected routes and tests
- [x] 3. Vocabulary: topics, CRUD, search/filter, bulk import and tests
- [x] 4. Learning engine: four modes, progress, scoring and tests
- [x] 5. Weak words: selection, page and practice
- [x] 6. Weekly review: seven-day selection, results and mistakes
- [x] 7. Dashboard and statistics: daily goal, summaries and charts
- [x] 8. Polish: responsive UI, validation, documentation and browser fixes
- [ ] 9. GitHub: inspect account/repository, secrets review, push and verification

Implementation milestones 1–8 are complete. Final frontend build/lint/format checks, the backend Release build, all 44 tests, and a clean isolated npm install passed; see [verification.md](verification.md). GitHub creation, push, and remote verification remain pending.

## Environment inspection

The workspace was empty. Git, Node 24, .NET 8 and 9 SDKs, and authenticated GitHub CLI are available. The application targets .NET 8. System npm and Docker were unavailable, so npm runs from ignored `.local/npm/package/bin/npm-cli.js` using the bundled Node runtime.

Portable PostgreSQL 18.6 is installed under ignored `.local/` and listens only on `127.0.0.1:55432`. The `vocabmate` database uses a dedicated application login, SCRAM authentication, UTF8, and UTC. Both EF migrations were applied. Database credentials and the JWT signing key are stored only in ignored local configuration.

