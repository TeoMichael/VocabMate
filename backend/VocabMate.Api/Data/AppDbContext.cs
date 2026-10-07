using Microsoft.EntityFrameworkCore;
using VocabMate.Api.Entities;

namespace VocabMate.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Vocabulary> Vocabularies => Set<Vocabulary>();
    public DbSet<LearningProgress> LearningProgresses => Set<LearningProgress>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizResult> QuizResults => Set<QuizResult>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>(user =>
        {
            user.Property(x => x.Name).HasMaxLength(80);
            user.Property(x => x.Email).HasMaxLength(254);
            user.Property(x => x.NormalizedEmail).HasMaxLength(254);
            user.Property(x => x.PasswordHash).HasMaxLength(512);
            user.HasIndex(x => x.NormalizedEmail).IsUnique();
        });
        model.Entity<Topic>(topic =>
        {
            topic.Property(x => x.Name).HasMaxLength(80);
            topic.Property(x => x.NormalizedName).HasMaxLength(80);
            topic.HasAlternateKey(x => new { x.Id, x.UserId });
            topic.HasIndex(x => new { x.UserId, x.NormalizedName }).IsUnique();
            topic.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        model.Entity<Vocabulary>(word =>
        {
            word.Property(x => x.Word).HasMaxLength(120);
            word.Property(x => x.Meaning).HasMaxLength(500);
            word.Property(x => x.ExampleSentence).HasMaxLength(1000);
            word.HasAlternateKey(x => new { x.Id, x.UserId });
            word.HasIndex(x => new { x.UserId, x.CreatedAt });
            word.HasIndex(x => new { x.UserId, x.Word });
            word.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            // The composite key prevents a topic owned by another user being assigned.
            word.HasOne(x => x.Topic).WithMany(x => x.Vocabularies)
                .HasForeignKey(x => new { x.TopicId, x.UserId })
                .HasPrincipalKey(x => new { x.Id, x.UserId }).OnDelete(DeleteBehavior.Restrict);
        });
        model.Entity<LearningProgress>(progress =>
        {
            progress.Property(x => x.CorrectCount).IsConcurrencyToken();
            progress.Property(x => x.WrongCount).IsConcurrencyToken();
            progress.Property(x => x.MasteryLevel).HasConversion<string>().HasMaxLength(16);
            progress.HasIndex(x => new { x.UserId, x.MasteryLevel });
            progress.HasIndex(x => new { x.VocabularyId, x.UserId }).IsUnique();
            progress.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            progress.HasOne(x => x.Vocabulary).WithOne(x => x.Progress)
                .HasForeignKey<LearningProgress>(x => new { x.VocabularyId, x.UserId })
                .HasPrincipalKey<Vocabulary>(x => new { x.Id, x.UserId }).OnDelete(DeleteBehavior.Cascade);
        });
        model.Entity<Quiz>(quiz =>
        {
            quiz.Property(x => x.Revision).IsConcurrencyToken();
            quiz.Property(x => x.QuizType).HasConversion<string>().HasMaxLength(16);
            quiz.HasIndex(x => new { x.UserId, x.CreatedAt });
            quiz.HasIndex(x => x.UserId).IsUnique()
                .HasDatabaseName("IX_Quizzes_OneActiveWeeklyPerUser")
                .HasFilter("\"QuizType\" = 'WEEKLY' AND \"CompletedAt\" IS NULL");
            quiz.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        model.Entity<QuizResult>(result =>
        {
            result.Property(x => x.IsCorrect).IsConcurrencyToken();
            result.Property(x => x.Mode).HasConversion<string>().HasMaxLength(24);
            result.Property(x => x.Word).HasMaxLength(120);
            result.Property(x => x.Meaning).HasMaxLength(500);
            result.Property(x => x.ExampleSentence).HasMaxLength(1000);
            result.Property(x => x.Prompt).HasMaxLength(600);
            result.Property(x => x.CorrectAnswer).HasMaxLength(500);
            result.Property(x => x.UserAnswer).HasMaxLength(1000);
            result.HasIndex(x => new { x.QuizId, x.Position }).IsUnique();
            result.HasOne(x => x.Quiz).WithMany(x => x.Results).HasForeignKey(x => x.QuizId).OnDelete(DeleteBehavior.Cascade);
            result.HasOne(x => x.Vocabulary).WithMany().HasForeignKey(x => x.VocabularyId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
