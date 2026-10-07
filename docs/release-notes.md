# VocabMate v1.0.0

First stable release of VocabMate, a personalized English vocabulary learning application built with React, ASP.NET Core, and PostgreSQL.

## Highlights

- Personal vocabulary library, search, mastery/topic filters, and bulk import with line-level validation.
- Topic management and authenticated ownership of all learning data.
- Flashcards, multiple choice, fill meaning, and reverse quizzes.
- Deterministic mastery, focused Weak Words practice, and daily goals.
- Weekly reviews prioritizing recent vocabulary, with saved results and mistake review.
- Resumable sessions and statistics from real recorded answers.
- Responsive vibrant pink interface with keyboard support and friendly empty/error states.

Release fixes prevent ambiguous multiple-choice aliases, preserve valid sessions during temporary API outages, and keep UTC chart dates consistent. Regression coverage includes JWT rejection, daily boundaries, and private error handling. Vulnerable transitive test dependencies were updated.

## Verification

Backend builds completed with zero warnings/errors and 59 tests passed in Debug and Release. Frontend clean install, build, lint, formatting, and two tests passed. Both migrations were applied to a fresh PostgreSQL database, followed by 179 live API assertions and browser core-flow checks. See `docs/release-verification.md` for evidence and scope.

## Known limits

Access tokens have no refresh/revocation flow. Daily goals use UTC days, and vocabulary lists have no pagination. Production hosting/security operations require separate setup. Docker configuration was inspected and stub-tested; actual Docker startup was unavailable. V1 excludes AI, speech, social features, and native mobile apps.
