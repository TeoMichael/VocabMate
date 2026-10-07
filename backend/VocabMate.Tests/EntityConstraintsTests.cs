using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using VocabMate.Api.Data;
using VocabMate.Api.Entities;

namespace VocabMate.Tests;

public class EntityConstraintsTests
{
    [Fact]
    public async Task DatabaseAllowsOnlyOneActiveWeeklyQuizPerUser()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var user = new User { Name = "Student", Email = "student@example.test", NormalizedEmail = "STUDENT@EXAMPLE.TEST" };
        var active = new Quiz { UserId = user.Id, QuizType = QuizType.WEEKLY };
        db.Users.Add(user);
        db.Quizzes.Add(active);
        await db.SaveChangesAsync();

        var duplicate = new Quiz { UserId = user.Id, QuizType = QuizType.WEEKLY };
        db.Quizzes.Add(duplicate);
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        db.Entry(duplicate).State = EntityState.Detached;

        active.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        db.Quizzes.Add(new Quiz { UserId = user.Id, QuizType = QuizType.WEEKLY });
        db.Quizzes.Add(new Quiz { UserId = user.Id, QuizType = QuizType.PRACTICE });
        db.Quizzes.Add(new Quiz { UserId = user.Id, QuizType = QuizType.PRACTICE });
        await db.SaveChangesAsync();
        Assert.Equal(4, await db.Quizzes.CountAsync());
    }

    [Fact]
    public async Task DeletingVocabularyPreservesOriginalAnswerIdentity()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var user = new User { Name = "Student", Email = "student@example.test", NormalizedEmail = "STUDENT@EXAMPLE.TEST" };
        var word = new Vocabulary { UserId = user.Id, Word = "acquire", Meaning = "có được" };
        word.Progress = new LearningProgress { UserId = user.Id, VocabularyId = word.Id };
        var quiz = new Quiz { UserId = user.Id, QuizType = QuizType.PRACTICE };
        var result = new QuizResult { QuizId = quiz.Id, VocabularyId = word.Id, OriginalVocabularyId = word.Id };
        quiz.Results.Add(result);
        db.AddRange(user, word, quiz);
        await db.SaveChangesAsync();
        db.Vocabularies.Remove(word);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        var saved = await db.QuizResults.SingleAsync();
        Assert.Null(saved.VocabularyId);
        Assert.Equal(word.Id, saved.OriginalVocabularyId);
    }
}
