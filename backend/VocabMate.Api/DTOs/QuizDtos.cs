using System.ComponentModel.DataAnnotations;
using VocabMate.Api.Entities;

namespace VocabMate.Api.DTOs;

public record StartPracticeRequest
{
    public QuizType QuizType { get; init; } = QuizType.PRACTICE;
    public LearningMode Mode { get; init; } = LearningMode.FLASHCARD;
    [Range(1, 20)] public int Size { get; init; } = 10;
}

public record AnswerRequest
{
    public Guid QuestionId { get; init; }
    [StringLength(1000)] public string? Answer { get; init; }
    public bool? Known { get; init; }
}

public record QuestionDto(Guid Id, Guid? VocabularyId, string Word, LearningMode Mode, string Prompt,
    string[] Options, string? UserAnswer, bool? IsCorrect, string? CorrectAnswer, bool Revealed);
public record QuizSessionDto(Guid Id, QuizType QuizType, int Score, int TotalQuestions,
    DateTime? CompletedAt, DateTime CreatedAt, List<QuestionDto> Questions, int Mastered, int Learning, int NeedReview);
public record AnswerResponse(bool IsCorrect, string CorrectAnswer, QuizSessionDto Quiz);
public record RevealResponse(string Meaning, string? ExampleSentence);
public record QuizSummaryDto(Guid Id, QuizType QuizType, int Score, int TotalQuestions, DateTime CreatedAt, DateTime? CompletedAt);
public record WeeklyReviewDto(bool Available, DateTime AvailableAt, DateTime WindowStart, DateTime WindowEnd,
    int WordsLearned, int QuestionCount, Guid? LastQuizId);
