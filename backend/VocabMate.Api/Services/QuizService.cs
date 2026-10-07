using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using VocabMate.Api.Data;
using VocabMate.Api.DTOs;
using VocabMate.Api.Entities;
using VocabMate.Api.Helpers;

namespace VocabMate.Api.Services;

public class QuizService(AppDbContext db, LearningProgressService progressService, TimeProvider clock)
{
    public async Task<QuizSessionDto> Start(Guid userId, StartPracticeRequest request)
    {
        if (!Enum.IsDefined(request.QuizType) || !Enum.IsDefined(request.Mode))
            throw new ApiException(400, "Choose a valid quiz type and learning mode.");

        if (request.QuizType == QuizType.WEEKLY)
        {
            var weekly = await Weekly(userId);
            if (weekly.ActiveQuizId.HasValue) return await Get(userId, weekly.ActiveQuizId.Value);
            if (!weekly.Available)
                throw new ApiException(409, $"Your next weekly review is available on {weekly.AvailableAt:yyyy-MM-dd} UTC.");
        }

        var words = await db.Vocabularies.Include(v => v.Progress).Where(v => v.UserId == userId).ToListAsync();
        var now = clock.GetUtcNow().UtcDateTime;
        var selected = PracticeSelector.Select(words, request.QuizType, request.Size, now);
        if (selected.Count == 0)
            throw new ApiException(400, request.QuizType == QuizType.WEAK_WORDS
                ? "You have no weak words to practice. Try daily practice instead."
                : "Add vocabulary before starting a practice session.");

        var quiz = new Quiz { UserId = userId, QuizType = request.QuizType, CreatedAt = now, TotalQuestions = selected.Count };
        var meanings = words.Select(v => v.Meaning).DistinctBy(LearningProgressService.Normalize).ToList();
        for (var position = 0; position < selected.Count; position++)
        {
            var word = selected[position];
            var mode = request.QuizType == QuizType.WEEKLY
                ? (position % 3) switch { 0 => LearningMode.MULTIPLE_CHOICE, 1 => LearningMode.FILL_MEANING, _ => LearningMode.REVERSE }
                : request.Mode;
            if (mode == LearningMode.MULTIPLE_CHOICE && meanings.Count < 2) mode = LearningMode.FILL_MEANING;

            var options = mode == LearningMode.MULTIPLE_CHOICE
                ? meanings.Where(m => LearningProgressService.Normalize(m) != LearningProgressService.Normalize(word.Meaning))
                    .OrderBy(_ => Random.Shared.Next()).Take(3).Append(word.Meaning).OrderBy(_ => Random.Shared.Next()).ToArray()
                : [];
            quiz.Results.Add(new QuizResult
            {
                QuizId = quiz.Id, VocabularyId = word.Id, OriginalVocabularyId = word.Id, Position = position, Mode = mode,
                Word = word.Word, Meaning = word.Meaning, ExampleSentence = word.ExampleSentence,
                Prompt = mode == LearningMode.REVERSE ? word.Meaning : word.Word,
                CorrectAnswer = mode == LearningMode.REVERSE ? word.Word : word.Meaning,
                OptionsJson = JsonSerializer.Serialize(options)
            });
        }
        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync();
        return await Get(userId, quiz.Id);
    }

    public async Task<QuizSessionDto> Get(Guid userId, Guid quizId)
    {
        var quiz = await FindQuiz(userId, quizId);
        return ToDto(quiz);
    }

    public async Task<List<QuizSummaryDto>> History(Guid userId, bool completed = true) => await db.Quizzes.AsNoTracking()
        .Where(q => q.UserId == userId && (completed ? q.CompletedAt != null : q.CompletedAt == null))
        .OrderByDescending(q => q.CompletedAt).ThenByDescending(q => q.CreatedAt).Take(50)
        .Select(q => new QuizSummaryDto(q.Id, q.QuizType, q.Score, q.TotalQuestions, q.CreatedAt, q.CompletedAt)).ToListAsync();

    public async Task<RevealResponse> Reveal(Guid userId, Guid quizId, Guid questionId)
    {
        var quiz = await FindQuiz(userId, quizId);
        var question = CurrentQuestion(quiz, questionId);
        if (question.Mode != LearningMode.FLASHCARD) throw new ApiException(400, "Only flashcards can be revealed.");
        question.Revealed = true;
        await SaveAnswerChanges();
        return new RevealResponse(question.Meaning, question.ExampleSentence);
    }

    public async Task<AnswerResponse> Answer(Guid userId, Guid quizId, AnswerRequest request)
    {
        var quiz = await FindQuiz(userId, quizId);
        var question = CurrentQuestion(quiz, request.QuestionId);
        bool isCorrect;
        if (question.Mode == LearningMode.FLASHCARD)
        {
            if (!question.Revealed || request.Known == null)
                throw new ApiException(400, "Reveal the flashcard, then choose whether you know it.");
            isCorrect = request.Known.Value;
            question.UserAnswer = isCorrect ? "I know this" : "I don't know";
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Answer)) throw new ApiException(400, "Enter an answer.");
            if (question.Mode == LearningMode.MULTIPLE_CHOICE &&
                !JsonSerializer.Deserialize<string[]>(question.OptionsJson)!.Contains(request.Answer))
                throw new ApiException(400, "Choose one of the supplied answers.");
            isCorrect = question.Mode == LearningMode.FILL_MEANING
                ? LearningProgressService.MatchesMeaning(request.Answer, question.CorrectAnswer)
                : LearningProgressService.Normalize(request.Answer) == LearningProgressService.Normalize(question.CorrectAnswer);
            question.UserAnswer = request.Answer.Trim();
        }

        question.IsCorrect = isCorrect;
        question.AnsweredAt = clock.GetUtcNow().UtcDateTime;
        if (question.Vocabulary?.UserId == userId) progressService.RecordAnswer(question.Vocabulary.Progress, isCorrect);
        quiz.Score = quiz.Results.Count(r => r.IsCorrect == true);
        quiz.Revision++;
        if (quiz.Results.All(r => r.IsCorrect != null)) quiz.CompletedAt = question.AnsweredAt;
        // One SaveChanges transaction commits the answer, score and progress together.
        await SaveAnswerChanges();
        return new AnswerResponse(isCorrect, question.CorrectAnswer, ToDto(quiz));
    }

    public async Task<WeeklyReviewDto> Weekly(Guid userId)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new ApiException(401, "Your account could not be found. Please sign in again.");
        var last = await db.Quizzes.AsNoTracking().Where(q => q.UserId == userId && q.QuizType == QuizType.WEEKLY && q.CompletedAt != null)
            .OrderByDescending(q => q.CompletedAt).FirstOrDefaultAsync();
        var active = await db.Quizzes.AsNoTracking().FirstOrDefaultAsync(q =>
            q.UserId == userId && q.QuizType == QuizType.WEEKLY && q.CompletedAt == null);
        var availableAt = (last?.CompletedAt ?? user.CreatedAt).AddDays(7);
        var now = clock.GetUtcNow().UtcDateTime;
        var start = now.AddDays(-7);
        var count = await db.Vocabularies.CountAsync(v => v.UserId == userId);
        var recent = await db.Vocabularies.CountAsync(v => v.UserId == userId && v.CreatedAt >= start && v.CreatedAt <= now);
        return new WeeklyReviewDto(active != null || (now >= availableAt && count > 0), availableAt, start, now,
            recent, active?.TotalQuestions ?? Math.Min(20, count), last?.Id, active?.Id);
    }

    private async Task<Quiz> FindQuiz(Guid userId, Guid quizId) => await db.Quizzes
        .Include(q => q.Results).ThenInclude(r => r.Vocabulary).ThenInclude(v => v!.Progress)
        .FirstOrDefaultAsync(q => q.Id == quizId && q.UserId == userId)
        ?? throw new ApiException(404, "Quiz not found.");

    private static QuizResult CurrentQuestion(Quiz quiz, Guid questionId)
    {
        var question = quiz.Results.FirstOrDefault(r => r.Id == questionId) ?? throw new ApiException(404, "Question not found.");
        if (quiz.CompletedAt != null || question.IsCorrect != null) throw new ApiException(409, "This answer has already been recorded.");
        if (quiz.Results.OrderBy(r => r.Position).First(r => r.IsCorrect == null).Id != questionId)
            throw new ApiException(400, "Answer the current question before continuing.");
        return question;
    }

    private async Task SaveAnswerChanges()
    {
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            throw new ApiException(409, "This session changed in another request. Reload it to continue.");
        }
    }

    private static QuizSessionDto ToDto(Quiz quiz)
    {
        var mastered = quiz.Results.Count(r => r.IsCorrect == true && r.Vocabulary?.Progress.MasteryLevel == MasteryLevel.MASTERED);
        return new QuizSessionDto(quiz.Id, quiz.QuizType, quiz.Score, quiz.TotalQuestions, quiz.CompletedAt, quiz.CreatedAt,
            quiz.Results.OrderBy(r => r.Position).Select(r => new QuestionDto(r.Id, r.VocabularyId,
                r.Mode == LearningMode.REVERSE && r.IsCorrect == null ? "" : r.Word,
                r.Mode, r.Prompt, JsonSerializer.Deserialize<string[]>(r.OptionsJson) ?? [], r.UserAnswer, r.IsCorrect,
                r.IsCorrect != null ? r.CorrectAnswer : null, r.Revealed)).ToList(),
            mastered, quiz.Score - mastered, quiz.Results.Count(r => r.IsCorrect == false));
    }
}
