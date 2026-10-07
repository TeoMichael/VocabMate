using Microsoft.EntityFrameworkCore;
using VocabMate.Api.Data;
using VocabMate.Api.DTOs;
using VocabMate.Api.Entities;

namespace VocabMate.Api.Services;

public class StatisticsService(AppDbContext db, TimeProvider clock)
{
    public async Task<StatisticsDto> Get(Guid userId)
    {
        var words = await db.Vocabularies.AsNoTracking().Include(v => v.Progress).Where(v => v.UserId == userId).ToListAsync();
        var answers = db.QuizResults.AsNoTracking().Where(r => r.Quiz.UserId == userId && r.IsCorrect != null);
        var correct = await answers.CountAsync(r => r.IsCorrect == true);
        var incorrect = await answers.CountAsync(r => r.IsCorrect == false);
        var today = clock.GetUtcNow().UtcDateTime.Date;
        var todayPracticed = await answers.Where(r => r.AnsweredAt >= today && r.AnsweredAt < today.AddDays(1))
            .Select(r => r.OriginalVocabularyId).Distinct().CountAsync();
        var trend = Enumerable.Range(0, 14).Select(day => today.AddDays(day - 13))
            .Select(date => new WordsOverTimeDto(date.ToString("yyyy-MM-dd"), words.Count(v => v.CreatedAt.Date == date))).ToList();
        return new StatisticsDto(words.Count,
            words.Count(v => v.Progress.MasteryLevel == MasteryLevel.NEW),
            words.Count(v => v.Progress.MasteryLevel == MasteryLevel.LEARNING),
            words.Count(v => v.Progress.MasteryLevel == MasteryLevel.FAMILIAR),
            words.Count(v => v.Progress.MasteryLevel == MasteryLevel.MASTERED),
            correct + incorrect == 0 ? 0 : Math.Round(100.0 * correct / (correct + incorrect), 1),
            await db.Quizzes.CountAsync(q => q.UserId == userId && q.CompletedAt != null), correct, incorrect,
            todayPracticed, 10,
            words.Count(v => v.Progress.LastReviewed != null && v.Progress.MasteryLevel != MasteryLevel.MASTERED),
            words.Count(v => v.Progress.LastReviewed == null), trend);
    }
}
