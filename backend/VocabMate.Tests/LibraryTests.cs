using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using VocabMate.Api.DTOs;

namespace VocabMate.Tests;

public class LibraryTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    [Fact]
    public async Task VocabularyCrudPersistsProgressAndSearchFilters()
    {
        using var client = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(client);
        var topicResponse = await client.PostAsJsonAsync("/api/topics", new TopicRequest("Travel"));
        var topic = (await topicResponse.Content.ReadFromJsonAsync<TopicDto>())!;
        var created = await client.PostAsJsonAsync("/api/vocabularies", new VocabularyRequest(" acquire ", " có được ", "She acquired skills.", topic.Id));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var word = (await created.Content.ReadFromJsonAsync<VocabularyDto>(JsonOptions))!;
        Assert.Equal("acquire", word.Word);
        Assert.Equal("Travel", word.TopicName);
        Assert.Equal(0, word.CorrectCount);
        Assert.Equal("NEW", word.MasteryLevel.ToString());
        var searched = await client.GetFromJsonAsync<List<VocabularyDto>>($"/api/vocabularies?search=ACQUIRE&topicId={topic.Id}&masteryLevel=NEW", JsonOptions);
        Assert.Single(searched!);
        var updated = await client.PutAsJsonAsync($"/api/vocabularies/{word.Id}", new VocabularyRequest("purchase", "mua", null, null));
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal("purchase", (await updated.Content.ReadFromJsonAsync<VocabularyDto>(JsonOptions))!.Word);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/vocabularies/{word.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/vocabularies/{word.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<VocabularyDto>>("/api/vocabularies", JsonOptions))!);
    }

    [Fact]
    public async Task AnotherUserCannotReadEditDeleteOrAssignOwnedItems()
    {
        using var owner = factory.CreateApiClient();
        using var other = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(owner);
        await ApiFactory.RegisterAsync(other);
        var topicResponse = await owner.PostAsJsonAsync("/api/topics", new TopicRequest("Private topic"));
        var topic = (await topicResponse.Content.ReadFromJsonAsync<TopicDto>())!;
        var wordResponse = await owner.PostAsJsonAsync("/api/vocabularies", new VocabularyRequest("private", "riêng tư", null, topic.Id));
        var word = (await wordResponse.Content.ReadFromJsonAsync<VocabularyDto>(JsonOptions))!;
        Assert.Empty((await other.GetFromJsonAsync<List<VocabularyDto>>("/api/vocabularies", JsonOptions))!);
        Assert.Empty((await other.GetFromJsonAsync<List<TopicDto>>("/api/topics"))!);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/vocabularies/{word.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync($"/api/vocabularies/{word.Id}", new VocabularyRequest("changed", "đổi", null, null))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync($"/api/vocabularies/{word.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsJsonAsync("/api/vocabularies", new VocabularyRequest("test", "thử", null, topic.Id))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync($"/api/topics/{topic.Id}", new TopicRequest("changed"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync($"/api/topics/{topic.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsJsonAsync("/api/vocabularies/import", new ImportRequest("test - thử", topic.Id))).StatusCode);
    }

    [Fact]
    public async Task TopicNamesAreUniquePerUserAndUsedTopicCannotBeDeleted()
    {
        using var client = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(client);
        var created = await client.PostAsJsonAsync("/api/topics", new TopicRequest("TOEIC"));
        var topic = (await created.Content.ReadFromJsonAsync<TopicDto>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/topics", new TopicRequest(" toeic "))).StatusCode);
        await client.PostAsJsonAsync("/api/vocabularies", new VocabularyRequest("employee", "nhân viên", null, topic.Id));
        Assert.Equal(HttpStatusCode.Conflict, (await client.DeleteAsync($"/api/topics/{topic.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync($"/api/topics/{topic.Id}", new TopicRequest("Work"))).StatusCode);
        var unusedResponse = await client.PostAsJsonAsync("/api/topics", new TopicRequest("Unused"));
        var unused = (await unusedResponse.Content.ReadFromJsonAsync<TopicDto>())!;
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/topics/{unused.Id}")).StatusCode);
    }

    [Fact]
    public async Task ImportKeepsValidVietnameseLinesAndReportsInvalidLineNumbers()
    {
        using var client = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(client);
        var response = await client.PostAsJsonAsync("/api/vocabularies/import",
            new ImportRequest("acquire - đạt được\npurchase - mua\ninvalid\n\navailable - có sẵn", null));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var imported = (await response.Content.ReadFromJsonAsync<ImportResponse>())!;
        Assert.Equal(3, imported.ImportedCount);
        Assert.Single(imported.InvalidLines);
        Assert.Equal(3, imported.InvalidLines[0].LineNumber);
        var words = await client.GetFromJsonAsync<List<VocabularyDto>>("/api/vocabularies", JsonOptions);
        Assert.Equal(3, words!.Count);
        Assert.Contains(words, x => x.Meaning == "có sẵn");
    }

    [Fact]
    public async Task BlankWordsAndOversizedImportsAreRejected()
    {
        using var client = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(client);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/vocabularies", new VocabularyRequest(" ", "meaning", null, null))).StatusCode);
        var text = string.Join('\n', Enumerable.Repeat("word - meaning", 501));
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/vocabularies/import", new ImportRequest(text, null))).StatusCode);
    }
}
