namespace VocabMate.Api.Entities;

public enum MasteryLevel { NEW, LEARNING, FAMILIAR, MASTERED }
public enum QuizType { PRACTICE, WEAK_WORDS, WEEKLY }
public enum LearningMode { FLASHCARD, MULTIPLE_CHOICE, FILL_MEANING, REVERSE }

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string NormalizedEmail { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Topic
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public string NormalizedName { get; set; } = "";
    public List<Vocabulary> Vocabularies { get; set; } = [];
}

public class Vocabulary
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid? TopicId { get; set; }
    public Topic? Topic { get; set; }
    public string Word { get; set; } = "";
    public string Meaning { get; set; } = "";
    public string? ExampleSentence { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public LearningProgress Progress { get; set; } = null!;
}

public class LearningProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid VocabularyId { get; set; }
    public Vocabulary Vocabulary { get; set; } = null!;
    public int CorrectCount { get; set; }
    public int WrongCount { get; set; }
    public MasteryLevel MasteryLevel { get; set; } = MasteryLevel.NEW;
    public DateTime? LastReviewed { get; set; }
}

public class Quiz
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public QuizType QuizType { get; set; }
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public int Revision { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public List<QuizResult> Results { get; set; } = [];
}

public class QuizResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public Guid? VocabularyId { get; set; }
    // Retain the original identity for daily counts after the vocabulary is deleted.
    public Guid OriginalVocabularyId { get; set; }
    public Vocabulary? Vocabulary { get; set; }
    public int Position { get; set; }
    public LearningMode Mode { get; set; }
    public string Word { get; set; } = "";
    public string Meaning { get; set; } = "";
    public string? ExampleSentence { get; set; }
    public string Prompt { get; set; } = "";
    public string CorrectAnswer { get; set; } = "";
    public string OptionsJson { get; set; } = "[]";
    public string? UserAnswer { get; set; }
    public bool? IsCorrect { get; set; }
    public bool Revealed { get; set; }
    public DateTime? AnsweredAt { get; set; }
}
