using System.ComponentModel.DataAnnotations;
using VocabMate.Api.Entities;

namespace VocabMate.Api.DTOs;

public record TopicRequest([Required, StringLength(80, MinimumLength = 1)] string Name);
public record TopicDto(Guid Id, string Name, int VocabularyCount);

public record VocabularyRequest(
    [Required, StringLength(120, MinimumLength = 1)] string Word,
    [Required, StringLength(500, MinimumLength = 1)] string Meaning,
    [StringLength(1000)] string? ExampleSentence,
    Guid? TopicId);

public record VocabularyDto(Guid Id, string Word, string Meaning, string? ExampleSentence,
    Guid? TopicId, string? TopicName, DateTime CreatedAt, int CorrectCount, int WrongCount,
    MasteryLevel MasteryLevel, DateTime? LastReviewed);

public record ImportRequest([Required, StringLength(320000)] string Text, Guid? TopicId);
public record InvalidImportLine(int LineNumber, string Text, string Reason);
public record ImportResponse(int ImportedCount, IReadOnlyList<InvalidImportLine> InvalidLines);
