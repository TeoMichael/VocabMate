# Demo guide

This walkthrough presents the real learning workflow: personal vocabulary, practice, mistakes, mastery, weekly review, and statistics. The screenshots use a local **Mia Nguyen** account with six vocabulary entries created through the interface/API and persisted in PostgreSQL.

The captured demonstration includes six completed quizzes and a weekly result of **5/6 (83%)**, with an intentional mistake on `travel`. Overall answer totals and daily counters change when more practice is performed, so explain the live values instead of memorizing fixed totals.

## Start the local application

In the original configured workspace, use two terminals from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend.ps1
```

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-frontend.ps1
```

Open [VocabMate](http://localhost:5173). The API is at [localhost:5080/api](http://localhost:5080/api), and Development Swagger is at [localhost:5080/swagger](http://localhost:5080/swagger). The backend helper starts the workspace's portable PostgreSQL if it is present.

The retained local demo login is stored in ignored `.local/demo-account.json`. Credentials are not included in documentation or Git. A cloned repository has no shared demo login or seeded vocabulary; follow the README setup and register your own account.

## Vocabulary used in the demonstration

| Word        | Meaning            | Topic         |
| ----------- | ------------------ | ------------- |
| acquire     | đạt được / có được | Daily English |
| purchase    | mua                | Daily English |
| available   | có sẵn             | Daily English |
| employee    | nhân viên          | Daily English |
| environment | môi trường         | Daily English |
| travel      | du lịch            | Travel        |

`environment` has the example “We can protect the environment together.” `travel` has “I love to travel and learn new words.”

To recreate the library in a fresh account, create the **Daily English** and **Travel** topics. Bulk import these five lines into Daily English:

```text
acquire - đạt được / có được
purchase - mua
available - có sẵn
employee - nhân viên
environment - môi trường
```

Add `travel` separately with its Travel topic, then edit the two example sentences. To demonstrate validation, include a line without a separator during import: valid lines are saved and the invalid line is returned for correction. Blank lines are ignored.

## Presentation walkthrough

1. **Login:** sign in with your own local demo account. Credentials stay outside Git.
2. **Overview:** show vocabulary, daily suggestions, mastery totals, and the ten-word daily goal. The goal counts distinct words since 00:00 UTC; every accepted answer contributes to answer totals.
3. **Add a word:** enter `travel`, its Vietnamese meaning, example, and topic. Show the saved confirmation.
4. **Bulk import:** paste the five Daily English lines above plus a malformed line. Show valid entries saved and the original invalid line number returned for correction.
5. **Library and topics:** search Vietnamese text, combine topic/mastery filters, and edit an example. Rename a topic; a topic with words has deletion disabled. Use disposable words/topics if demonstrating deletion.
6. **Practice selection:** point out all four modes and choose a short session.
7. **Question modes:** reveal a flashcard before self-assessment, then demonstrate multiple choice or a typed question. For `acquire`, either `đạt được` or `có được` is accepted. Case and extra spaces are normalized; accents remain significant. An alias cannot appear as a supposedly wrong multiple-choice option.
8. **Saved session and progress:** leave a partly answered session, Resume, and reload. Earlier answers remain saved and the first unanswered question opens. Explain `max(correctCount - wrongCount, 0)` and the four mastery thresholds.
9. **Words to review:** explain `wrongCount >= 2 && wrongCount >= correctCount`. In a fresh one-word account, two flashcard misses make it weak; three correct focused answers make it leave the list. Use a separate rehearsal account so you do not alter your prepared presentation history.
10. **Weekly review:** explain recent → weak → previously reviewed → remaining word selection, with at most 20 distinct words. Use an eligible local account prepared below, or open Mia's saved result.
11. **Finish or resume the weekly test:** demonstrate mixed modes and leave/resume once. One deliberate mistake makes feedback and mistake review visible.
12. **Results:** show the saved score and Review mistakes. Mia's existing six-question result is 5/6 (83%), with `travel` → `du lịch`. Completing a review starts the next seven-day wait.
13. **Statistics:** show real mastery counts, answer accuracy, completed quizzes, and vocabulary growth. Reopen a completed result from history.
14. **Mobile, keyboard, and persistence:** narrow the window, use the drawer, Tab/Shift+Tab/Escape, and Enter in typed quizzes. Log out, visit a protected page, log in, and show that the library persisted.

Practicing during the presentation changes the persisted counters. The saved weekly result remains 5/6, but current mastery summaries can change as the same words receive later answers.

## Weekly eligibility in a fresh account

New accounts unlock their first weekly review seven days after registration. Later reviews unlock seven days after the last completed weekly test. An unfinished weekly review can be resumed from its saved question snapshots, even if live vocabulary is later removed.

For verification, only newly created local demonstration/verification accounts had their registration dates backdated. The application rule was not changed and cloned projects enforce seven days. No public endpoint exists for changing that date.

To rehearse without waiting, create a **separate development database** using the README migration steps, register a new disposable demonstration account, and add its words. In your PostgreSQL SQL editor connected to that database, replace the example email below with that account's email and run:

```sql
UPDATE "Users"
SET "CreatedAt" = CURRENT_TIMESTAMP - INTERVAL '8 days'
WHERE "NormalizedEmail" = UPPER('your-new-demo-email@example.test');
```

Confirm that exactly one intended demonstration row changed, then reload Weekly Review. Do this only for the new local rehearsal account, never production or another person's account. Completion still starts the normal seven-day cooldown. Mia's retained account already has a result to present without changing timestamps or waiting for a new test.

## Evidence and scope

Final release verification passed 59 backend tests, two frontend regression tests, 179 real PostgreSQL API assertions on a fresh migrated database, and 11 isolated startup-helper assertions. Clean npm and NuGet audits reported no vulnerable packages. Actual Docker container startup was unavailable; portable PostgreSQL supplied the live database checks.

See [release verification](release-verification.md), [business rules](business-rules.md), and [the screenshot gallery](../README.md#screenshots). V1 uses deterministic rules and stored vocabulary; AI definitions, pronunciation scoring, social features, and complex gamification are outside this demonstration.
