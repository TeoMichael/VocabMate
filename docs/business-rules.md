# Business rules

These rules are deterministic and live in backend services so the algorithm can be explained, tested, and changed later. The frontend displays the server's decisions.

## Authentication and ownership

Registration stores a secure password hash, never a plain password. Normalized email is unique. Successful registration/login returns an eight-hour JWT and public user details. Protected requests identify the user from the validated token.

Each user can read and modify only their vocabulary, topics, progress, quizzes, and statistics. Client-provided foreign IDs are checked against that ownership. Logout removes the tab's `sessionStorage` token. V1 does not implement refresh tokens or server-side revocation.

## Vocabulary and bulk import

A vocabulary item requires a nonblank English word and meaning. Its example and topic are optional. Creating a word creates a progress record with zero counters and `NEW` mastery. A topic must belong to the same user. A used topic cannot be deleted until its vocabulary is reassigned or removed.

Bulk input uses one `word - meaning` entry per nonblank line, with whitespace around the hyphen separator. Split on the first separator, trim both sides, validate each item, and create separate vocabulary records. Blank lines are ignored and do not consume the 500-line limit. A malformed or oversized line is reported with its original line number and reason; it does not prevent other valid lines from being imported. Requests allow at most 500 nonblank lines and 320,000 input characters. CR, LF, and CRLF line endings preserve line boundaries. The optional topic applies to all valid imported entries and must be owned by the user.

## Mastery calculation

Each accepted answer increases either `CorrectCount` or `WrongCount`, then updates `LastReviewed` to the current UTC time. Historical counters never decrease. Effective progress is:

```text
effectiveCorrect = max(CorrectCount - WrongCount, 0)
```

| Effective correct answers | Mastery  |
| ------------------------- | -------- |
| 0                         | NEW      |
| 1–2                       | LEARNING |
| 3–4                       | FAMILIAR |
| 5 or more                 | MASTERED |

An incorrect answer can lower mastery by reducing effective progress. For example, five correct and zero wrong means `MASTERED`; five correct and one wrong means `FAMILIAR`. Counters retain the full history while this simple net score reflects setbacks. A word with past answers can return to `NEW`; the label describes current mastery, not whether it has ever been seen.

## Weak-word detection

A word is weak when both conditions hold:

```text
WrongCount >= 2 AND WrongCount >= CorrectCount
```

This excludes a single accidental mistake and allows successful practice to remove a word from the weak list. Two wrong and one correct is weak; two wrong and three correct is not. The weak-word page and `WEAK_WORDS` sessions use the same predicate. A weak session contains only qualifying words and requires at least one such word.

## Answer normalization

Typed answers are normalized with Unicode Form KC, trimmed, converted to lowercase, and have consecutive whitespace collapsed to one space. Vietnamese accents remain significant. Punctuation is not generally removed and there is no fuzzy matching, translation service, or NLP comparison.

For meaning entry, slash (`/`) and semicolon (`;`) separate accepted aliases. With the saved meaning `đạt được / có được`, either normalized phrase is accepted; the complete normalized saved meaning is also accepted. Reverse quizzes normalize the English word directly and do not split it into aliases.

## Learning modes

| Mode            | Prompt and answer rule                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FLASHCARD       | Shows the English word. The user must reveal the meaning before submitting “I know this” or “I don't know.” The server records that self-assessment.        |
| MULTIPLE_CHOICE | Shows the word with its saved meaning and distinct distractor meanings from the same user's library. The selected saved option is compared to the solution. |
| FILL_MEANING    | Shows the word; the typed meaning is compared using the normalization and aliases above.                                                                    |
| REVERSE         | Shows the meaning; the typed English word is normalized and compared to the saved word.                                                                     |

Multiple choice offers two to four distinct meanings, depending on the user's vocabulary. Distractors are excluded when any normalized slash/semicolon alias overlaps an accepted meaning of the solution. For example, `mua hàng` cannot be a wrong option for `mua / mua hàng`. If no honest distractor remains, that question falls back to `FILL_MEANING`; duplicate options are never used to fill four slots. Distractors cannot come from another user's data. No AI is required.

## Sessions and scoring

The server saves one snapshot per selected vocabulary item, with its mode, prompt, solution, and options. Sessions contain at most twenty questions and never repeat a vocabulary ID. A small library produces a smaller test. An empty eligible selection returns a useful error/empty state instead of creating a zero-question quiz. Answers follow question order so saved sessions can resume at the first unanswered question.

Each question accepts one answer. An accepted correct answer contributes one point; an incorrect answer contributes zero. The session completes after all questions are answered. Accuracy is `Score / TotalQuestions × 100`, with zero denominators handled safely. The results show the saved score, current mastery summary, and answered mistakes. Incomplete sessions do not count as completed quizzes.

Unanswered solutions stay on the server. Flashcard reveal is explicit; the answer response supplies the solution after scoring. Repeated or competing answer submissions cannot count a question twice. Answer, score, and progress updates are saved together. Deleting live vocabulary preserves quiz snapshots but prevents later answers from updating the removed word's progress.

`GET /api/quizzes` returns completed sessions by default. `GET /api/quizzes?completed=false` returns unfinished sessions so the user can resume their first unanswered question. Each list contains at most 50 of that user's sessions; unfinished sessions have a null completion timestamp.

## Daily practice

The daily goal is ten distinct vocabulary IDs with accepted answers during the current UTC calendar day. Practicing the same word repeatedly increases its answer counters but advances the daily goal only once. Dashboard review count includes previously reviewed words below `MASTERED`; new practice count includes words never reviewed.

Regular practice initially reserves roughly two thirds of its slots for previously reviewed words and one third for unreviewed words, then fills unused slots from either group. Reviewed words prioritize weak status, lower mastery, and older review time. Unreviewed words use creation order.

The API is authoritative for the date boundary. The dashboard explicitly shows "Resets at 00:00 UTC" (07:00 in Vietnam). Statistics use UTC date labels for growth buckets so western browser timezones cannot move a bucket to the previous date. Event timestamps still display in the browser's locale. Keeping this common boundary avoids introducing timezone preferences or trusting client clocks in V1. There is no streak system.

## Weekly availability

The first weekly review becomes available seven days after account registration. Later reviews become available seven days after the latest completed `WEEKLY` quiz. Starting or abandoning a weekly session does not reset that eligibility clock; completion does.

Availability is checked on request, so V1 needs no timer service, scheduled job, or background worker. Creating a new review requires at least one live vocabulary item. An existing unfinished weekly review remains available from its snapshots even if all source vocabulary is deleted.

The API returns `availableAt` to explain when a new test unlocks, `lastQuizId` for completed results, and `activeQuizId` for the unfinished review. Starting weekly practice resumes that active session before checking eligibility for a new test. Its preview question count stays equal to the saved test size. The same service could support automatic reminders later.

## Weekly selection

The weekly window is the rolling seven days ending at session creation, using UTC timestamps. “Words learned” in the weekly preview counts vocabulary added in that window; it does not mean that all those words reached `MASTERED`.

Select owned vocabulary in the following priority order until the requested size, capped at twenty, is reached:

1. Words added during the rolling seven-day window.
2. Weak words that have not already been selected.
3. Previously reviewed words that have not already been selected.
4. Remaining owned words if more questions are needed.

A vocabulary ID appears only once, even if it is both recent and weak. Fewer than twenty available words means fewer questions. Recent words have priority even when they already appear familiar or mastered. Recent vocabulary is ordered newest first; weak and reviewed groups start with the oldest review times; the final group starts with the oldest creation times.

Weekly tests cycle through multiple choice, fill meaning, and reverse quiz questions. Multiple choice keeps its small-library fallback. Weekly answers update progress through the same scoring rules as other sessions.

## Statistics

- Vocabulary and mastery counts describe the current library.
- Correct and incorrect answer totals describe stored answered quiz questions, including questions whose live vocabulary was later deleted.
- Overall quiz accuracy is correct answers divided by all answered questions, expressed as a percentage.
- Total quizzes counts completed sessions only.
- Vocabulary growth groups current vocabulary creation dates into UTC day buckets.
- The daily goal counts distinct word IDs answered that UTC day.

The quiz results summary labels correct answers on currently mastered words as `mastered`, other correct answers as `learning`, and incorrect answers as `needReview`. Its three counts describe that session's answers and add up to the question count after completion; `learning` here includes correct answers on `NEW`, `LEARNING`, or `FAMILIAR` words.

These views answer different questions: current mastery describes the library now, while answer accuracy describes historical performance. They should not be presented as interchangeable percentages.
