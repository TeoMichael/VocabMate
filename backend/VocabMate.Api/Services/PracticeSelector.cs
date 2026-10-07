using VocabMate.Api.Entities;

namespace VocabMate.Api.Services;

public static class PracticeSelector
{
    public static List<Vocabulary> Select(IEnumerable<Vocabulary> vocabulary, QuizType quizType, int size, DateTime now)
    {
        var words = vocabulary.ToList();
        if (quizType == QuizType.WEAK_WORDS)
            return words.Where(v => LearningProgressService.IsWeak(v.Progress))
                .OrderByDescending(v => v.Progress.WrongCount - v.Progress.CorrectCount)
                .ThenBy(v => v.Progress.LastReviewed).ThenBy(v => v.Id).Take(size).ToList();

        if (quizType == QuizType.WEEKLY)
        {
            var cutoff = now.AddDays(-7);
            // Each group is ordered separately so weak/older words cannot displace this week's words.
            return words.Where(v => v.CreatedAt >= cutoff && v.CreatedAt <= now).OrderByDescending(v => v.CreatedAt)
                .Concat(words.Where(v => LearningProgressService.IsWeak(v.Progress)).OrderBy(v => v.Progress.LastReviewed))
                .Concat(words.Where(v => v.Progress.LastReviewed != null).OrderBy(v => v.Progress.LastReviewed))
                .Concat(words.OrderBy(v => v.CreatedAt))
                .DistinctBy(v => v.Id).Take(size).ToList();
        }

        // Roughly two thirds review, one third new; fill spare places from either group.
        var reviewed = words.Where(v => v.Progress.LastReviewed != null)
            .OrderByDescending(v => LearningProgressService.IsWeak(v.Progress))
            .ThenBy(v => v.Progress.MasteryLevel).ThenBy(v => v.Progress.LastReviewed).ToList();
        var newWords = words.Where(v => v.Progress.LastReviewed == null).OrderBy(v => v.CreatedAt).ToList();
        return reviewed.Take((int)Math.Ceiling(size * 0.67))
            .Concat(newWords.Take(size - (int)Math.Ceiling(size * 0.67)))
            .Concat(reviewed).Concat(newWords).DistinctBy(v => v.Id).Take(size).ToList();
    }
}
