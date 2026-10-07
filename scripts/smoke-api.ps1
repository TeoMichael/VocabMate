#Requires -Version 7.0
<#
.SYNOPSIS
Exercise the running API using fresh verification accounts and real HTTP requests.
.DESCRIPTION
Creates two accounts with random credentials held only in memory. Prints their IDs
for cleanup. An optional local wrapper can dot-source this script to arrange and
check the seven-day weekly fixture, then remove only these verification accounts.
#>
param([string]$ApiUrl = 'http://localhost:5080/api')

$ErrorActionPreference = 'Stop'
$ApiUrl = $ApiUrl.TrimEnd('/')
$script:SmokeAssertions = 0
$script:SmokeAccountIds = @()

function Assert-Smoke {
    param([bool]$Condition, [string]$Description)
    if (-not $Condition) { throw "Smoke assertion failed: $Description" }
    $script:SmokeAssertions++
}

function Invoke-SmokeApi {
    param([string]$Method, [string]$Path, [hashtable]$Body, [hashtable]$Headers = @{}, [int]$Expected = 200)
    $request = @{ Method = $Method; Uri = "$ApiUrl/$Path"; Headers = $Headers; SkipHttpErrorCheck = $true }
    if ($null -ne $Body) {
        $request.ContentType = 'application/json; charset=utf-8'
        $request.Body = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 10 -Compress))
    }
    $response = Invoke-WebRequest @request
    Assert-Smoke ($response.StatusCode -eq $Expected) "$Method $Path returned $($response.StatusCode), expected $Expected"
    if ($response.Content) { return $response.Content | ConvertFrom-Json }
}

function Complete-SmokeQuiz {
    param($Quiz, [hashtable]$Words, [switch]$FirstWrong)
    $current = $Quiz
    for ($index = 0; $index -lt $Quiz.questions.Count; $index++) {
        $question = $Quiz.questions[$index]
        $word = $Words[$question.vocabularyId]
        $answer = if ($question.mode -eq 'REVERSE') { $word.word } else { $word.meaning }
        if ($FirstWrong -and $index -eq 0) {
            $answer = if ($question.mode -eq 'MULTIPLE_CHOICE') {
                @($question.options | Where-Object { $_ -ne $answer })[0]
            } else { 'deliberately incorrect' }
        } elseif ($question.mode -ne 'MULTIPLE_CHOICE') {
            $answer = '  ' + $answer.ToUpperInvariant().Replace(' ', '   ') + '  '
        }
        $scored = Invoke-SmokeApi POST "quizzes/$($Quiz.id)/answers" @{ questionId = $question.id; answer = $answer } $OwnerHeaders
        Assert-Smoke ($scored.isCorrect -eq (-not ($FirstWrong -and $index -eq 0))) 'server-side answer scoring'
        $current = $scored.quiz
    }
    Assert-Smoke ($null -ne $current.completedAt) 'quiz completion is recorded'
    return $current
}

$suffix = [Guid]::NewGuid().ToString('N')
$password = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
$ownerEmail = "smoke-owner-$suffix@example.test"
$owner = Invoke-SmokeApi POST auth/register @{ name = 'Verification learner'; email = $ownerEmail; password = $password } -Expected 201
$script:SmokeAccountIds += $owner.user.id
$OwnerHeaders = @{ Authorization = "Bearer $($owner.token)" }
$other = Invoke-SmokeApi POST auth/register @{ name = 'Ownership verification'; email = "smoke-other-$suffix@example.test"; password = $password } -Expected 201
$script:SmokeAccountIds += $other.user.id
$OtherHeaders = @{ Authorization = "Bearer $($other.token)" }
$identity = Invoke-SmokeApi GET auth/me -Headers $OwnerHeaders
Assert-Smoke ($identity.id -eq $owner.user.id) 'authenticated identity'
$login = Invoke-SmokeApi POST auth/login @{ email = $ownerEmail.ToUpperInvariant(); password = $password }
Assert-Smoke ($login.user.id -eq $owner.user.id) 'login accepts normalized email'
$null = Invoke-SmokeApi POST auth/login @{ email = $ownerEmail; password = 'incorrect-password' } -Expected 401
$null = Invoke-SmokeApi GET vocabularies -Expected 401
$null = Invoke-SmokeApi POST auth/register @{ name = 'Duplicate'; email = $ownerEmail; password = $password } -Expected 409

$topic = Invoke-SmokeApi POST topics @{ name = 'Travel' } $OwnerHeaders 201
$null = Invoke-SmokeApi POST topics @{ name = ' travel ' } $OwnerHeaders 409
$topic = Invoke-SmokeApi PUT "topics/$($topic.id)" @{ name = 'Journey' } $OwnerHeaders
Assert-Smoke ($topic.name -eq 'Journey') 'topic rename'
$null = Invoke-SmokeApi POST topics @{ name = ' ' } $OwnerHeaders 400
$null = Invoke-SmokeApi PUT "topics/$($topic.id)" @{ name = 'Stolen' } $OtherHeaders 404
$null = Invoke-SmokeApi DELETE "topics/$($topic.id)" -Headers $OtherHeaders -Expected 404

$word = Invoke-SmokeApi POST vocabularies @{ word = ' acquire '; meaning = ' có được '; exampleSentence = 'She acquired new skills.'; topicId = $topic.id } $OwnerHeaders 201
Assert-Smoke ($word.word -eq 'acquire' -and $word.meaning -eq 'có được' -and $word.masteryLevel -eq 'NEW') 'vocabulary trimming and initial progress'
$null = Invoke-SmokeApi DELETE "topics/$($topic.id)" -Headers $OwnerHeaders -Expected 409
$word = Invoke-SmokeApi PUT "vocabularies/$($word.id)" @{ word = 'acquire'; meaning = 'có được'; exampleSentence = 'We acquired knowledge.'; topicId = $topic.id } $OwnerHeaders
Assert-Smoke ($word.exampleSentence -eq 'We acquired knowledge.') 'vocabulary edit'
$found = @(Invoke-SmokeApi GET "vocabularies?search=ACQUIRE&topicId=$($topic.id)&masteryLevel=NEW" -Headers $OwnerHeaders)
Assert-Smoke ($found.Count -eq 1 -and $found[0].id -eq $word.id) 'search and topic/mastery filters'
Assert-Smoke (@(Invoke-SmokeApi GET vocabularies -Headers $OtherHeaders).Count -eq 0) 'other account vocabulary is empty'
$null = Invoke-SmokeApi GET "vocabularies/$($word.id)" -Headers $OtherHeaders -Expected 404
$null = Invoke-SmokeApi PUT "vocabularies/$($word.id)" @{ word = 'stolen'; meaning = 'stolen' } $OtherHeaders 404
$null = Invoke-SmokeApi DELETE "vocabularies/$($word.id)" -Headers $OtherHeaders -Expected 404
$null = Invoke-SmokeApi POST vocabularies @{ word = 'stolen'; meaning = 'stolen'; topicId = $topic.id } $OtherHeaders 404
$null = Invoke-SmokeApi POST vocabularies/import @{ text = 'stolen - stolen'; topicId = $topic.id } $OtherHeaders 404

# A single word makes the mastery and weak-word checks deterministic.
for ($index = 1; $index -le 5; $index++) {
    $quiz = Invoke-SmokeApi POST practice @{ mode = 'FLASHCARD'; size = 1 } $OwnerHeaders 201
    $question = $quiz.questions[0]
    if ($index -eq 1) {
        $null = Invoke-SmokeApi POST "quizzes/$($quiz.id)/answers" @{ questionId = $question.id; known = $true } $OwnerHeaders 400
        Assert-Smoke ($null -eq $question.correctAnswer) 'flashcard hides the answer before reveal'
    }
    $reveal = Invoke-SmokeApi POST "quizzes/$($quiz.id)/questions/$($question.id)/reveal" -Headers $OwnerHeaders
    Assert-Smoke ($reveal.meaning -eq 'có được') 'flashcard reveal'
    $result = Invoke-SmokeApi POST "quizzes/$($quiz.id)/answers" @{ questionId = $question.id; known = $true } $OwnerHeaders
    Assert-Smoke ($result.isCorrect -and $result.quiz.score -eq 1 -and $null -ne $result.quiz.completedAt) 'flashcard self-assessment'
    $progress = Invoke-SmokeApi GET "vocabularies/$($word.id)" -Headers $OwnerHeaders
    $expectedMastery = if ($index -le 2) { 'LEARNING' } elseif ($index -le 4) { 'FAMILIAR' } else { 'MASTERED' }
    Assert-Smoke ($progress.correctCount -eq $index -and $progress.masteryLevel -eq $expectedMastery) 'mastery threshold'
}
for ($index = 1; $index -le 5; $index++) {
    $quiz = Invoke-SmokeApi POST practice @{ mode = 'FLASHCARD'; size = 1 } $OwnerHeaders 201
    $question = $quiz.questions[0]
    $null = Invoke-SmokeApi POST "quizzes/$($quiz.id)/questions/$($question.id)/reveal" -Headers $OwnerHeaders
    $result = Invoke-SmokeApi POST "quizzes/$($quiz.id)/answers" @{ questionId = $question.id; known = $false } $OwnerHeaders
    Assert-Smoke (-not $result.isCorrect -and $result.quiz.score -eq 0) 'incorrect flashcard affects progress'
}
$weak = @(Invoke-SmokeApi GET 'vocabularies?weakOnly=true' -Headers $OwnerHeaders)
Assert-Smoke ($weak.Count -eq 1 -and $weak[0].wrongCount -eq 5 -and $weak[0].masteryLevel -eq 'NEW') 'weak detection and mastery demotion'
$weakQuiz = Invoke-SmokeApi POST practice @{ quizType = 'WEAK_WORDS'; mode = 'FILL_MEANING'; size = 20 } $OwnerHeaders 201
Assert-Smoke ($weakQuiz.totalQuestions -eq 1 -and $weakQuiz.questions[0].vocabularyId -eq $word.id) 'weak practice selects only weak words'
$wordMap = @{ $word.id = $word }
$null = Complete-SmokeQuiz $weakQuiz $wordMap
Assert-Smoke (@(Invoke-SmokeApi GET 'vocabularies?weakOnly=true' -Headers $OwnerHeaders).Count -eq 0) 'successful recovery removes weak status'
$beforeDelete = Invoke-SmokeApi GET statistics -Headers $OwnerHeaders
Assert-Smoke ($beforeDelete.todayPracticed -eq 1) 'daily goal counts distinct vocabulary'
$null = Invoke-SmokeApi DELETE "vocabularies/$($word.id)" -Headers $OwnerHeaders -Expected 204
$null = Invoke-SmokeApi GET "vocabularies/$($word.id)" -Headers $OwnerHeaders -Expected 404
$afterDelete = Invoke-SmokeApi GET statistics -Headers $OwnerHeaders
Assert-Smoke ($afterDelete.todayPracticed -eq 1 -and $afterDelete.totalVocabulary -eq 0) 'deleted word retains daily history'
$null = Invoke-SmokeApi DELETE "topics/$($topic.id)" -Headers $OwnerHeaders -Expected 204

$import = Invoke-SmokeApi POST vocabularies/import @{ text = "purchase - mua`navailable - có sẵn`nemployee - nhân viên`ninvalid line`n" } $OwnerHeaders
Assert-Smoke ($import.importedCount -eq 3 -and $import.invalidLines.Count -eq 1 -and $import.invalidLines[0].lineNumber -eq 4) 'bulk import reports invalid lines and keeps valid ones'
$words = @(Invoke-SmokeApi GET vocabularies -Headers $OwnerHeaders)
$wordMap = @{}
foreach ($item in $words) { $wordMap[$item.id] = $item }
Assert-Smoke ($words.Count -eq 3 -and @($words | Where-Object meaning -eq 'có sẵn').Count -eq 1) 'Vietnamese meanings persist in PostgreSQL'

$reverse = Invoke-SmokeApi POST practice @{ mode = 'REVERSE'; size = 20 } $OwnerHeaders 201
Assert-Smoke ($reverse.totalQuestions -eq 3 -and $reverse.questions[0].word -eq '' -and $null -eq $reverse.questions[0].correctAnswer) 'reverse quiz hides English answer and handles small library'
$null = Invoke-SmokeApi GET "quizzes/$($reverse.id)" -Headers $OtherHeaders -Expected 404
$null = Invoke-SmokeApi POST "quizzes/$($reverse.id)/answers" @{ questionId = $reverse.questions[0].id; answer = 'purchase' } $OtherHeaders 404
$reverse = Complete-SmokeQuiz $reverse $wordMap -FirstWrong
Assert-Smoke ($reverse.score -eq 2 -and $reverse.needReview -eq 1) 'reverse score and mistake count'

$choice = Invoke-SmokeApi POST practice @{ mode = 'MULTIPLE_CHOICE'; size = 20 } $OwnerHeaders 201
foreach ($question in $choice.questions) {
    Assert-Smoke ($question.options.Count -eq 3 -and $question.options -contains $wordMap[$question.vocabularyId].meaning) 'multiple-choice correct option'
    foreach ($option in $question.options) { Assert-Smoke ($words.meaning -contains $option) 'distractor belongs to current user' }
}
$choice = Complete-SmokeQuiz $choice $wordMap
$null = Invoke-SmokeApi POST "quizzes/$($choice.id)/answers" @{ questionId = $choice.questions[-1].id; answer = $choice.questions[-1].correctAnswer } $OwnerHeaders 409
$fill = Invoke-SmokeApi POST practice @{ mode = 'FILL_MEANING'; size = 20 } $OwnerHeaders 201
$null = Complete-SmokeQuiz $fill $wordMap
$stats = Invoke-SmokeApi GET statistics -Headers $OwnerHeaders
Assert-Smoke ($stats.correctAnswers -eq 14 -and $stats.incorrectAnswers -eq 6 -and $stats.overallAccuracy -eq 70) 'accuracy across correct/incorrect answers'
Assert-Smoke ($stats.totalQuizzes -eq 14 -and $stats.todayPracticed -eq 4 -and $stats.dailyGoal -eq 10) 'completed quiz and distinct daily statistics'
Assert-Smoke ($stats.totalVocabulary -eq 3 -and $stats.familiar -eq 2 -and $stats.learning -eq 1) 'mastery distribution'
$history = @(Invoke-SmokeApi GET quizzes -Headers $OwnerHeaders)
Assert-Smoke ($history.Count -eq 14) 'completed quiz history'
$weekly = Invoke-SmokeApi GET practice/weekly -Headers $OwnerHeaders
Assert-Smoke (-not $weekly.available -and $weekly.wordsLearned -eq 3 -and $weekly.questionCount -eq 3) 'weekly review waits seven days and counts recent vocabulary'
$null = Invoke-SmokeApi POST practice @{ quizType = 'WEEKLY'; size = 20 } $OwnerHeaders 409

[pscustomobject]@{ Passed = $script:SmokeAssertions; VerificationAccountIds = $script:SmokeAccountIds }
