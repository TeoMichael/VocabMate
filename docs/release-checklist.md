# V1 release checklist

The approved dashboard remains the visual reference. This pass targets correctness, usability, verification, and release documentation; it does not expand V1 scope.

- [x] Inspect repository history, source, migrations, tests, scripts, configuration, and screenshots.
- [x] Run baseline checks: clean npm install, frontend build/lint/format, backend restore/build/47 tests, 179 PostgreSQL assertions, and 11 setup-helper assertions.
- [x] Reproduce and fix confirmed quiz, authentication, and usability issues.
- [x] Expand regression coverage to 59 backend tests and two frontend tests.
- [x] Apply both migrations from zero to a separate PostgreSQL database and verify repeatability/model consistency.
- [x] Exercise every core workflow through the production frontend and Release API.
- [x] Check long content, five responsive widths, focus, errors, empty states, loading, and daily goal values.
- [x] Verify ownership, JWT validation, secrets exclusion, and resolve vulnerable transitive test dependencies.
- [x] Update demo instructions, README, limitations, and dashboard/statistics screenshots.
- [x] Run final clean install, Debug/Release builds/tests, lint, formatting, 179 live assertions, and 11 helper checks.
- [x] Commit verified fixes and prepare v1.0.0 metadata for the existing authenticated private GitHub repository.

## Resolved findings

- Overlapping meaning aliases are excluded from multiple-choice distractors.
- Temporary API outages preserve valid sessions and offer retry.
- UTC date-only chart labels remain on their original calendar date.
- The daily reset is visible beside the goal and in statistics.
- Maximum-length topic and word notifications keep their actions usable.
- All three test-project dependency advisories were removed and the full suite rerun.

No local release blocker remains. Evidence is recorded in [release verification](release-verification.md). GitHub delivery is the final step: push main, verify its commit, push the annotated `v1.0.0` tag, create the release, and verify their identities. The final delivery report records those remote results.
