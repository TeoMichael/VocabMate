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

1. **Overview:** show Mia's personal library, the daily practice suggestion, mastery totals, and the ten-word daily goal. Explain that the goal counts distinct words practiced that UTC day, while answer totals count every accepted answer.
2. **My vocabulary:** search for `environment`, filter by topic or mastery, and open its edit form. Explain optional examples and topic ownership. Show the import dialog's `word - meaning` format and invalid-line feedback.
3. **Practice:** point out the four modes. Reveal a flashcard before self-assessment; choose a multiple-choice meaning; type a Vietnamese meaning; and type an English word in reverse quiz. For `acquire`, either `đạt được` or `có được` is accepted. Case and extra spaces are normalized; Vietnamese accents remain significant.
4. **Saved session:** leave a partly answered session, then use its Resume action on the Practice page. The first unanswered question opens with earlier answers already saved.
5. **Words to review:** explain the rule `wrongCount >= 2 && wrongCount >= correctCount`. Start focused practice from that section; the session includes only qualifying words. A single mistake alone does not make a word weak.
6. **Weekly review:** open the saved six-question result. Show 5/6, 83% accuracy, and Review mistakes. The `travel` mistake displays `du lịch` as the correct meaning. Explain selection priority: vocabulary added during the previous seven days, weak words, previously reviewed words, then any remaining words.
7. **Statistics:** show current mastery counts, recorded answer accuracy, completed quizzes, and vocabulary added over time. Explain the deterministic mastery score `max(correctCount - wrongCount, 0)` and its four thresholds.
8. **Mobile and keyboard:** show vocabulary cards at a narrow width, open/close the mobile navigation, and use Tab/Shift+Tab/Escape. In a typed quiz, Enter checks the answer and Next word returns to the new prompt.
9. **Persistence:** log out and log back in. The vocabulary and progress come from PostgreSQL and remain available after the browser session ends.

Practicing during the presentation changes the persisted counters. The saved weekly result remains 5/6, but current mastery summaries can change as the same words receive later answers.

## Weekly eligibility in a fresh account

New accounts unlock their first weekly review seven days after registration. Later reviews unlock seven days after the last completed weekly test. An unfinished weekly review can be resumed from its saved question snapshots, even if live vocabulary is later removed.

For browser verification, only the local demonstration account's registration date was backdated to exercise the weekly workflow immediately. The application rule was not changed and cloned projects still enforce seven days. No public endpoint exists for changing that registration date.

## Evidence and scope

The audit ran 47 backend tests, 179 real PostgreSQL API assertions, and 11 isolated startup-helper assertions. A clean dependency install reported zero npm vulnerabilities. Actual Docker container startup was unavailable on this machine; portable PostgreSQL supplied the live database checks.

See [verification](verification.md), [business rules](business-rules.md), and [the screenshot gallery](../README.md#screenshots). V1 uses deterministic rules and stored vocabulary; AI definitions, pronunciation scoring, social features, and complex gamification are outside this demonstration.
