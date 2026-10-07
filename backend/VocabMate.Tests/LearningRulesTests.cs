using VocabMate.Api.Entities;
using VocabMate.Api.Services;

namespace VocabMate.Tests;

public class LearningRulesTests
{
    [Theory]
    [InlineData(0, 0, MasteryLevel.NEW)]
    [InlineData(1, 0, MasteryLevel.LEARNING)]
    [InlineData(2, 0, MasteryLevel.LEARNING)]
    [InlineData(3, 0, MasteryLevel.FAMILIAR)]
    [InlineData(4, 0, MasteryLevel.FAMILIAR)]
    [InlineData(5, 0, MasteryLevel.MASTERED)]
    [InlineData(5, 1, MasteryLevel.FAMILIAR)]
    [InlineData(1, 4, MasteryLevel.NEW)]
    public void MasteryUsesNetCorrectAnswers(int correct, int wrong, MasteryLevel expected) =>
        Assert.Equal(expected, LearningProgressService.CalculateMastery(correct, wrong));

    [Theory]
    [InlineData(0, 1, false)]
    [InlineData(0, 2, true)]
    [InlineData(2, 2, true)]
    [InlineData(3, 2, false)]
    public void WeakWordsRequireTwoMistakesAndAtMostHalfAccuracy(int correct, int wrong, bool expected) =>
        Assert.Equal(expected, LearningProgressService.IsWeak(new LearningProgress { CorrectCount = correct, WrongCount = wrong }));

    [Theory]
    [InlineData("  CÓ    SẴN ", "có sẵn", true)]
    [InlineData("có được", "đạt được / có được", true)]
    [InlineData("mua", "mua; mua hàng", true)]
    [InlineData("co san", "có sẵn", false)]
    [InlineData("bán", "mua", false)]
    public void MeaningComparisonNormalizesSpacingCaseButRetainsAccents(string answer, string meaning, bool expected) =>
        Assert.Equal(expected, LearningProgressService.MatchesMeaning(answer, meaning));

    [Fact]
    public void WeeklyPrioritizesRecentThenWeakThenOldReviewedWithoutDuplicates()
    {
        var now = DateTime.UtcNow;
        var recent = Word(now.AddDays(-1), 0, 0);
        var boundary = Word(now.AddDays(-7), 0, 2);
        var weak = Word(now.AddDays(-30), 0, 2);
        var old = Word(now.AddDays(-60), 4, 0);
        var unreviewed = Word(now.AddDays(-90), 0, 0);
        var selection = PracticeSelector.Select([unreviewed, old, weak, boundary, recent], QuizType.WEEKLY, 4, now);
        Assert.Equal(new[] { recent.Id, boundary.Id, weak.Id, old.Id }, selection.Select(v => v.Id));
        Assert.Equal(5, PracticeSelector.Select([unreviewed, old, weak, boundary, recent], QuizType.WEEKLY, 20, now).Count);
    }

    [Fact]
    public void WeakSessionIncludesOnlyWeakWords()
    {
        var now = DateTime.UtcNow;
        var weak = Word(now, 1, 2);
        var recovered = Word(now, 3, 2);
        var newWord = Word(now, 0, 0);
        Assert.Equal(weak.Id, Assert.Single(PracticeSelector.Select([newWord, weak, recovered], QuizType.WEAK_WORDS, 20, now)).Id);
    }

    [Fact]
    public void DailySelectionIncludesNewWordsAndFillsSmallLibraries()
    {
        var now = DateTime.UtcNow;
        var reviewed = Enumerable.Range(0, 10).Select(_ => Word(now.AddDays(-10), 2, 0)).ToList();
        var newWords = Enumerable.Range(0, 10).Select(_ => Word(now, 0, 0)).ToList();
        var selected = PracticeSelector.Select(reviewed.Concat(newWords), QuizType.PRACTICE, 10, now);
        Assert.Equal(10, selected.Count);
        Assert.Equal(3, selected.Count(v => v.Progress.LastReviewed == null));
        Assert.Equal(2, PracticeSelector.Select(newWords.Take(2), QuizType.PRACTICE, 20, now).Count);
    }

    private static Vocabulary Word(DateTime createdAt, int correct, int wrong) => new()
    {
        CreatedAt = createdAt,
        Progress = new LearningProgress { CorrectCount = correct, WrongCount = wrong,
            MasteryLevel = LearningProgressService.CalculateMastery(correct, wrong),
            LastReviewed = correct + wrong == 0 ? null : createdAt }
    };
}
