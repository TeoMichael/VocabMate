using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using VocabMate.Api.Data;
using VocabMate.Api.DTOs;
using VocabMate.Api.Entities;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Tests;

public class LearningWorkflowTests : IDisposable
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private readonly AppDbContext db;
    private readonly QuizService quizzes;
    private readonly FixedClock clock = new();
    private readonly User user;

    public LearningWorkflowTests()
    {
        connection.Open();
        db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        db.Database.EnsureCreated();
        quizzes = new QuizService(db, new LearningProgressService(clock), clock);
        user = new User { Name = "Learner", Email = "learner@example.test", NormalizedEmail = "LEARNER@EXAMPLE.TEST", CreatedAt = clock.GetUtcNow().UtcDateTime.AddDays(-8) };
        db.Users.Add(user);
        db.SaveChanges();
    }

    [Theory]
    [InlineData(LearningMode.MULTIPLE_CHOICE)]
    [InlineData(LearningMode.FILL_MEANING)]
    [InlineData(LearningMode.REVERSE)]
    public async Task TypedModesScoreOnServerAndPreventDuplicateAnswers(LearningMode mode)
    {
        AddWord("purchase", "mua");
        AddWord("available", "có sẵn");
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { Mode = mode, Size = 2 });
        var first = quiz.Questions[0];
        Assert.Null(first.CorrectAnswer);
        if (mode == LearningMode.REVERSE) Assert.Equal("", first.Word);
        var original = await db.QuizResults.FindAsync(first.Id);
        var response = await quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = first.Id, Answer = original!.CorrectAnswer });
        Assert.True(response.IsCorrect);
        Assert.Equal(1, response.Quiz.Score);
        Assert.Equal(MasteryLevel.LEARNING, (await db.LearningProgresses.FirstAsync(p => p.VocabularyId == first.VocabularyId)).MasteryLevel);
        var duplicate = await Assert.ThrowsAsync<ApiException>(() => quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = first.Id, Answer = original.CorrectAnswer }));
        Assert.Equal(409, duplicate.StatusCode);
        var second = response.Quiz.Questions[1];
        var wrongAnswer = mode == LearningMode.MULTIPLE_CHOICE
            ? second.Options.First(o => o != db.QuizResults.Single(r => r.Id == second.Id).CorrectAnswer) : "incorrect";
        var complete = await quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = second.Id, Answer = wrongAnswer });
        Assert.NotNull(complete.Quiz.CompletedAt);
        Assert.Equal(1, complete.Quiz.Score);
        Assert.Equal(1, complete.Quiz.NeedReview);
        var stats = await new StatisticsService(db, clock).Get(user.Id);
        Assert.Equal(50, stats.OverallAccuracy);
        Assert.Equal(1, stats.TotalQuizzes);
        Assert.Equal(2, stats.TodayPracticed);
    }

    [Fact]
    public async Task FlashcardRequiresRevealAndRecordsHonestSelfAssessment()
    {
        var word = AddWord("purchase", "mua");
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { Mode = LearningMode.FLASHCARD });
        var question = Assert.Single(quiz.Questions);
        await Assert.ThrowsAsync<ApiException>(() => quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = question.Id, Known = true }));
        var reveal = await quizzes.Reveal(user.Id, quiz.Id, question.Id);
        Assert.Equal("mua", reveal.Meaning);
        await quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = question.Id, Known = false });
        Assert.Equal(1, word.Progress.WrongCount);
        Assert.Equal(clock.GetUtcNow().UtcDateTime, word.Progress.LastReviewed);
    }

    [Fact]
    public async Task OneMeaningMultipleChoiceFallsBackToFillMeaning()
    {
        AddWord("purchase", "mua");
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { Mode = LearningMode.MULTIPLE_CHOICE });
        Assert.Equal(LearningMode.FILL_MEANING, Assert.Single(quiz.Questions).Mode);
    }

    [Fact]
    public async Task WeeklyUnlocksAfterSevenDaysAndResumesThenLocksAfterCompletion()
    {
        AddWord("purchase", "mua");
        user.CreatedAt = clock.GetUtcNow().UtcDateTime.AddDays(-6);
        await db.SaveChangesAsync();
        Assert.False((await quizzes.Weekly(user.Id)).Available);
        await Assert.ThrowsAsync<ApiException>(() => quizzes.Start(user.Id, new StartPracticeRequest { QuizType = QuizType.WEEKLY }));
        user.CreatedAt = clock.GetUtcNow().UtcDateTime.AddDays(-7);
        await db.SaveChangesAsync();
        Assert.True((await quizzes.Weekly(user.Id)).Available);
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { QuizType = QuizType.WEEKLY });
        Assert.Equal(quiz.Id, (await quizzes.Start(user.Id, new StartPracticeRequest { QuizType = QuizType.WEEKLY })).Id);
        await quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = quiz.Questions[0].Id, Answer = "mua" });
        var weekly = await quizzes.Weekly(user.Id);
        Assert.False(weekly.Available);
        Assert.Equal(clock.GetUtcNow().UtcDateTime.AddDays(7), weekly.AvailableAt);
        Assert.Equal(quiz.Id, weekly.LastQuizId);
    }

    [Fact]
    public async Task WeeklySessionRemainsAvailableAndResumesAfterAllVocabularyIsDeleted()
    {
        var word = AddWord("purchase", "mua");
        var original = await quizzes.Start(user.Id, new StartPracticeRequest { QuizType = QuizType.WEEKLY });
        db.Vocabularies.Remove(word);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var availability = await quizzes.Weekly(user.Id);
        Assert.True(availability.Available);
        Assert.Equal(original.Id, availability.ActiveQuizId);
        Assert.Equal(1, availability.QuestionCount);
        var resumed = await quizzes.Start(user.Id, new StartPracticeRequest { QuizType = QuizType.WEEKLY });
        Assert.Equal(original.Id, resumed.Id);
        Assert.Null(resumed.Questions[0].VocabularyId);
        var completed = await quizzes.Answer(user.Id, resumed.Id,
            new AnswerRequest { QuestionId = resumed.Questions[0].Id, Answer = "mua" });
        Assert.True(completed.IsCorrect);
        Assert.NotNull(completed.Quiz.CompletedAt);
        Assert.Empty(await db.LearningProgresses.ToListAsync());
        Assert.False((await quizzes.Weekly(user.Id)).Available);
        Assert.Null((await quizzes.Weekly(user.Id)).ActiveQuizId);
    }

    [Fact]
    public async Task UsersCannotReadAnswerOrRevealAnotherUsersQuiz()
    {
        AddWord("purchase", "mua");
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest());
        var otherId = Guid.NewGuid();
        Assert.Equal(404, (await Assert.ThrowsAsync<ApiException>(() => quizzes.Get(otherId, quiz.Id))).StatusCode);
        Assert.Equal(404, (await Assert.ThrowsAsync<ApiException>(() => quizzes.Reveal(otherId, quiz.Id, quiz.Questions[0].Id))).StatusCode);
        Assert.Equal(404, (await Assert.ThrowsAsync<ApiException>(() => quizzes.Answer(otherId, quiz.Id, new AnswerRequest { QuestionId = quiz.Questions[0].Id, Known = true }))).StatusCode);
    }

    [Fact]
    public async Task DeletingVocabularyPreservesCompletedQuizHistory()
    {
        var word = AddWord("purchase", "mua");
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { Mode = LearningMode.REVERSE });
        await quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = quiz.Questions[0].Id, Answer = "purchase" });
        db.Vocabularies.Remove(word);
        await db.SaveChangesAsync();
        var history = await quizzes.Get(user.Id, quiz.Id);
        Assert.Equal("purchase", Assert.Single(history.Questions).CorrectAnswer);
        Assert.Null(history.Questions[0].VocabularyId);
        Assert.Equal(1, (await new StatisticsService(db, clock).Get(user.Id)).CorrectAnswers);
    }

    [Fact]
    public async Task RepeatedPracticeCountsOnceEvenAfterVocabularyDeletion()
    {
        var word = AddWord("purchase", "mua");
        for (var i = 0; i < 2; i++)
        {
            var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { Mode = LearningMode.REVERSE });
            await quizzes.Answer(user.Id, quiz.Id, new AnswerRequest { QuestionId = quiz.Questions[0].Id, Answer = "purchase" });
        }
        Assert.Equal(1, (await new StatisticsService(db, clock).Get(user.Id)).TodayPracticed);
        db.Vocabularies.Remove(word);
        await db.SaveChangesAsync();
        Assert.Equal(1, (await new StatisticsService(db, clock).Get(user.Id)).TodayPracticed);
    }

    [Fact]
    public async Task ConcurrentStaleAnswerCannotIncrementProgressTwice()
    {
        var word = AddWord("purchase", "mua");
        var quiz = await quizzes.Start(user.Id, new StartPracticeRequest { Mode = LearningMode.REVERSE });
        using var secondDb = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        var secondService = new QuizService(secondDb, new LearningProgressService(clock), clock);
        await secondService.Get(user.Id, quiz.Id); // Simulate two requests reading the unanswered question.
        var request = new AnswerRequest { QuestionId = quiz.Questions[0].Id, Answer = "purchase" };
        await quizzes.Answer(user.Id, quiz.Id, request);
        var conflict = await Assert.ThrowsAsync<ApiException>(() => secondService.Answer(user.Id, quiz.Id, request));
        Assert.Equal(409, conflict.StatusCode);
        await db.Entry(word.Progress).ReloadAsync();
        Assert.Equal(1, word.Progress.CorrectCount);
    }

    [Fact]
    public async Task DatabasePreventsTwoUnfinishedWeeklySessions()
    {
        AddWord("purchase", "mua");
        await quizzes.Start(user.Id, new StartPracticeRequest { QuizType = QuizType.WEEKLY });
        db.Quizzes.Add(new Quiz { UserId = user.Id, QuizType = QuizType.WEEKLY, TotalQuestions = 1 });
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    private Vocabulary AddWord(string text, string meaning)
    {
        var word = new Vocabulary { UserId = user.Id, Word = text, Meaning = meaning, CreatedAt = clock.GetUtcNow().UtcDateTime };
        word.Progress = new LearningProgress { UserId = user.Id, VocabularyId = word.Id, Vocabulary = word };
        db.Vocabularies.Add(word);
        db.SaveChanges();
        return word;
    }

    public void Dispose() { db.Dispose(); connection.Dispose(); }

    private class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 10, 7, 6, 0, 0, TimeSpan.Zero);
    }
}
