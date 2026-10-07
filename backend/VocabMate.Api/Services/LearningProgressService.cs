using System.Text;
using System.Text.RegularExpressions;
using VocabMate.Api.Entities;

namespace VocabMate.Api.Services;

public class LearningProgressService(TimeProvider clock)
{
    public static MasteryLevel CalculateMastery(int correctCount, int wrongCount)
    {
        var score = Math.Max(0, correctCount - wrongCount);
        return score switch
        {
            0 => MasteryLevel.NEW,
            <= 2 => MasteryLevel.LEARNING,
            <= 4 => MasteryLevel.FAMILIAR,
            _ => MasteryLevel.MASTERED
        };
    }

    public static bool IsWeak(LearningProgress progress) =>
        progress.WrongCount >= 2 && progress.WrongCount >= progress.CorrectCount;

    public void RecordAnswer(LearningProgress progress, bool isCorrect)
    {
        if (isCorrect) progress.CorrectCount++;
        else progress.WrongCount++;
        progress.MasteryLevel = CalculateMastery(progress.CorrectCount, progress.WrongCount);
        progress.LastReviewed = clock.GetUtcNow().UtcDateTime;
    }

    public static string Normalize(string value) =>
        Regex.Replace(value.Normalize(NormalizationForm.FormKC).Trim(), @"\s+", " ").ToLowerInvariant();

    public static bool MatchesMeaning(string answer, string meaning) =>
        meaning.Split(['/', ';'], StringSplitOptions.RemoveEmptyEntries)
            .Any(alias => Normalize(alias) == Normalize(answer)) || Normalize(meaning) == Normalize(answer);
}
