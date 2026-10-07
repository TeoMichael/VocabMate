# API contract

All protected endpoints use `Authorization: Bearer <token>`. JSON uses camelCase, enum strings are uppercase. IDs are GUID strings. Dates are UTC ISO strings. Errors are ProblemDetails with `detail`, and validation may include `errors`.

## Authentication
- POST `/api/auth/register` `{name,email,password}` and POST `/api/auth/login` `{email,password}` => `{token,expiresAt,user:{id,name,email,createdAt}}`
- GET `/api/auth/me` => user
- Logout discards token in frontend. Tokens expire in 8 hours.

## Library
- GET `/api/topics` => `[{id,name,vocabularyCount}]`
- POST `/api/topics` `{name}` => topic; PUT `/api/topics/{id}` `{name}` => topic; DELETE => 204 (409 if vocabulary still uses topic).
- GET `/api/vocabularies?search=&topicId=&masteryLevel=&weakOnly=false` => array of vocabulary
- GET `/api/vocabularies/{id}` => vocabulary
- POST/PUT vocabulary `{word,meaning,exampleSentence?,topicId?}` => vocabulary
- DELETE `/api/vocabularies/{id}` => 204
- POST `/api/vocabularies/import` `{text,topicId?}` => `{importedCount,invalidLines:[{lineNumber,text,reason}]}`. At most 500 nonblank lines and 320,000 input characters; blank lines are ignored, original line numbers are retained, and CR/LF line endings are supported.
- Vocabulary: `{id,word,meaning,exampleSentence,topicId,topicName,createdAt,correctCount,wrongCount,masteryLevel,lastReviewed}`

## Learning
- POST `/api/practice` `{quizType:'PRACTICE'|'WEAK_WORDS'|'WEEKLY',mode:'FLASHCARD'|'MULTIPLE_CHOICE'|'FILL_MEANING'|'REVERSE',size:20}` => QuizSession
- GET `/api/quizzes/{id}` => QuizSession (resume and results)
- GET `/api/quizzes` (default `completed=true`) => up to 50 completed quiz summaries; GET `/api/quizzes?completed=false` => up to 50 unfinished session summaries for resuming. Both lists belong only to the authenticated user. Summary: `{id,quizType,score,totalQuestions,createdAt,completedAt}`; `completedAt` is null for unfinished sessions.
- POST `/api/quizzes/{id}/answers` `{questionId,answer?,known?}` => `{isCorrect,correctAnswer,quiz:QuizSession}`
- POST `/api/quizzes/{id}/questions/{questionId}/reveal` => `{meaning,exampleSentence}` for flashcards
- QuizSession: `{id,quizType,score,totalQuestions,completedAt,createdAt,questions:[{id,vocabularyId,word,mode,prompt,options:string[],userAnswer,isCorrect:boolean|null,correctAnswer:string|null,revealed:boolean}],mastered,learning,needReview}`
- GET `/api/practice/weekly` => `{available,availableAt,windowStart,windowEnd,wordsLearned,questionCount,lastQuizId,activeQuizId}`. `lastQuizId` identifies the latest completed weekly review, and `activeQuizId` identifies the unfinished weekly review, if any. An active session stays available even after its source vocabulary is deleted, and `questionCount` then reflects its saved question count.
- GET `/api/statistics` => `{totalVocabulary,new,learning,familiar,mastered,overallAccuracy,totalQuizzes,correctAnswers,incorrectAnswers,todayPracticed,dailyGoal,reviewCount,newPracticeCount,wordsOverTime:[{date,count}]}`

Daily counters use UTC calendar days. New weekly selection covers the rolling 7 days ending now and unlocks 7 days after registration, then 7 days after the last completed weekly quiz. Starting weekly practice resumes an existing unfinished session before selecting a new test. Session size is at most 20 and never repeats a word. A saved question's `vocabularyId` becomes null after live vocabulary deletion; its prompt and historical result remain available.
