using System.Linq.Expressions;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using VocabMate.Api.Data;
using VocabMate.Api.DTOs;
using VocabMate.Api.Entities;
using VocabMate.Api.Helpers;

namespace VocabMate.Api.Services;

public class VocabularyService(AppDbContext db)
{
    private static readonly Expression<Func<Vocabulary, VocabularyDto>> Projection = word => new VocabularyDto(
        word.Id, word.Word, word.Meaning, word.ExampleSentence, word.TopicId,
        word.Topic == null ? null : word.Topic.Name, word.CreatedAt,
        word.Progress.CorrectCount, word.Progress.WrongCount, word.Progress.MasteryLevel, word.Progress.LastReviewed);

    public Task<List<VocabularyDto>> ListAsync(Guid userId, string? search, Guid? topicId, MasteryLevel? masteryLevel, bool weakOnly)
    {
        if (search?.Length > 200) throw new ApiException(400, "Search must be at most 200 characters.");
        if (masteryLevel.HasValue && !Enum.IsDefined(masteryLevel.Value))
            throw new ApiException(400, "Choose a valid mastery level.");
        var query = db.Vocabularies.AsNoTracking().Where(x => x.UserId == userId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Word.ToLower().Contains(term) || x.Meaning.ToLower().Contains(term));
        }
        if (topicId.HasValue) query = query.Where(x => x.TopicId == topicId);
        if (masteryLevel.HasValue) query = query.Where(x => x.Progress.MasteryLevel == masteryLevel);
        if (weakOnly) query = query.Where(x => x.Progress.WrongCount >= 2 && x.Progress.WrongCount >= x.Progress.CorrectCount);
        return query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Word).Select(Projection).ToListAsync();
    }

    public async Task<VocabularyDto> GetAsync(Guid userId, Guid id) =>
        await db.Vocabularies.AsNoTracking().Where(x => x.UserId == userId && x.Id == id)
            .Select(Projection).SingleOrDefaultAsync() ?? throw new ApiException(404, "Vocabulary was not found.");

    public async Task<VocabularyDto> CreateAsync(Guid userId, VocabularyRequest request)
    {
        await CheckTopicAsync(userId, request.TopicId);
        var word = NewVocabulary(userId, request);
        db.Vocabularies.Add(word);
        await db.SaveChangesAsync();
        return await GetAsync(userId, word.Id);
    }

    public async Task<VocabularyDto> UpdateAsync(Guid userId, Guid id, VocabularyRequest request)
    {
        var word = await db.Vocabularies.SingleOrDefaultAsync(x => x.UserId == userId && x.Id == id)
            ?? throw new ApiException(404, "Vocabulary was not found.");
        await CheckTopicAsync(userId, request.TopicId);
        ValidateVocabulary(request);
        word.Word = request.Word.Trim();
        word.Meaning = request.Meaning.Trim();
        word.ExampleSentence = CleanOptional(request.ExampleSentence);
        word.TopicId = request.TopicId;
        await db.SaveChangesAsync();
        return await GetAsync(userId, id);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var word = await db.Vocabularies.SingleOrDefaultAsync(x => x.UserId == userId && x.Id == id)
            ?? throw new ApiException(404, "Vocabulary was not found.");
        db.Vocabularies.Remove(word);
        await db.SaveChangesAsync();
    }

    public async Task<ImportResponse> ImportAsync(Guid userId, ImportRequest request)
    {
        await CheckTopicAsync(userId, request.TopicId);
        var lines = request.Text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
        if (lines.Count(line => !string.IsNullOrWhiteSpace(line)) > 500)
            throw new ApiException(400, "Import at most 500 nonblank lines at a time.");
        var invalid = new List<InvalidImportLine>();
        var importedCount = 0;
        for (var index = 0; index < lines.Length; index++)
        {
            var line = lines[index].Trim();
            if (line.Length == 0) continue;
            var separator = Regex.Match(line, @"\s+-\s+", RegexOptions.CultureInvariant);
            if (!separator.Success)
            {
                invalid.Add(new(index + 1, line, "Use word - meaning, with spaces around the hyphen."));
                continue;
            }
            var word = line[..separator.Index].Trim();
            var meaning = line[(separator.Index + separator.Length)..].Trim();
            if (word.Length is 0 or > 120 || meaning.Length is 0 or > 500)
            {
                invalid.Add(new(index + 1, line, "Word must have 1–120 characters and meaning 1–500 characters."));
                continue;
            }
            db.Vocabularies.Add(NewVocabulary(userId, new VocabularyRequest(word, meaning, null, request.TopicId)));
            importedCount++;
        }
        await db.SaveChangesAsync();
        return new(importedCount, invalid);
    }

    public Task<List<TopicDto>> ListTopicsAsync(Guid userId) => db.Topics.AsNoTracking()
        .Where(x => x.UserId == userId).OrderBy(x => x.Name)
        .Select(x => new TopicDto(x.Id, x.Name, x.Vocabularies.Count)).ToListAsync();

    public async Task<TopicDto> CreateTopicAsync(Guid userId, TopicRequest request)
    {
        var name = ValidateTopic(request);
        var normalized = name.ToUpperInvariant();
        await CheckTopicNameAsync(userId, normalized, null);
        var topic = new Topic { UserId = userId, Name = name, NormalizedName = normalized };
        db.Topics.Add(topic);
        await db.SaveChangesAsync();
        return new(topic.Id, topic.Name, 0);
    }

    public async Task<TopicDto> UpdateTopicAsync(Guid userId, Guid id, TopicRequest request)
    {
        var topic = await db.Topics.SingleOrDefaultAsync(x => x.UserId == userId && x.Id == id)
            ?? throw new ApiException(404, "Topic was not found.");
        var name = ValidateTopic(request);
        var normalized = name.ToUpperInvariant();
        await CheckTopicNameAsync(userId, normalized, id);
        topic.Name = name;
        topic.NormalizedName = normalized;
        await db.SaveChangesAsync();
        return new(id, name, await db.Vocabularies.CountAsync(x => x.UserId == userId && x.TopicId == id));
    }

    public async Task DeleteTopicAsync(Guid userId, Guid id)
    {
        var topic = await db.Topics.SingleOrDefaultAsync(x => x.UserId == userId && x.Id == id)
            ?? throw new ApiException(404, "Topic was not found.");
        if (await db.Vocabularies.AnyAsync(x => x.UserId == userId && x.TopicId == id))
            throw new ApiException(409, "Move or delete vocabulary in this topic before deleting it.");
        db.Topics.Remove(topic);
        await db.SaveChangesAsync();
    }

    private async Task CheckTopicAsync(Guid userId, Guid? topicId)
    {
        if (topicId.HasValue && !await db.Topics.AnyAsync(x => x.UserId == userId && x.Id == topicId))
            throw new ApiException(404, "Topic was not found.");
    }

    private async Task CheckTopicNameAsync(Guid userId, string normalized, Guid? excludingId)
    {
        if (await db.Topics.AnyAsync(x => x.UserId == userId && x.NormalizedName == normalized && x.Id != excludingId))
            throw new ApiException(409, "A topic with this name already exists.");
    }

    private static string ValidateTopic(TopicRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length is 0 or > 80) throw new ApiException(400, "Topic name must have 1–80 characters.");
        return name;
    }

    private static void ValidateVocabulary(VocabularyRequest request)
    {
        if (request.Word.Trim().Length is 0 or > 120 || request.Meaning.Trim().Length is 0 or > 500)
            throw new ApiException(400, "Word and meaning cannot be blank and must fit their length limits.");
        if (request.ExampleSentence?.Length > 1000) throw new ApiException(400, "Example must be at most 1000 characters.");
    }

    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static Vocabulary NewVocabulary(Guid userId, VocabularyRequest request)
    {
        ValidateVocabulary(request);
        var word = new Vocabulary
        {
            UserId = userId, Word = request.Word.Trim(), Meaning = request.Meaning.Trim(),
            ExampleSentence = CleanOptional(request.ExampleSentence), TopicId = request.TopicId
        };
        word.Progress = new LearningProgress { UserId = userId, VocabularyId = word.Id };
        return word;
    }
}
