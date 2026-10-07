namespace VocabMate.Api.DTOs;

public record WordsOverTimeDto(string Date, int Count);
public record StatisticsDto(int TotalVocabulary, int New, int Learning, int Familiar, int Mastered,
    double OverallAccuracy, int TotalQuizzes, int CorrectAnswers, int IncorrectAnswers,
    int TodayPracticed, int DailyGoal, int ReviewCount, int NewPracticeCount, List<WordsOverTimeDto> WordsOverTime);
