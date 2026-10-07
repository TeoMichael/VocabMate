using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using VocabMate.Api.DTOs;

namespace VocabMate.Tests;

public class QuizApiTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    [Fact]
    public async Task QuizRoutesValidateOwnershipAndScoreStoredAnswers()
    {
        using var factory = new ApiFactory();
        using var owner = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(owner);
        using var other = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(other);
        var vocabulary = await owner.PostAsJsonAsync("/api/vocabularies", new { word = "purchase", meaning = "mua" });
        vocabulary.EnsureSuccessStatusCode();
        var response = await owner.PostAsJsonAsync("/api/practice", new { quizType = "PRACTICE", mode = "REVERSE", size = 10 });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var quiz = (await response.Content.ReadFromJsonAsync<JsonElement>());
        var id = quiz.GetProperty("id").GetString();
        var question = quiz.GetProperty("questions")[0];
        var questionId = question.GetProperty("id").GetString();
        Assert.Equal(JsonValueKind.Null, question.GetProperty("correctAnswer").ValueKind);
        Assert.Equal("", question.GetProperty("word").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/quizzes/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsJsonAsync($"/api/quizzes/{id}/answers", new { questionId, answer = "purchase" })).StatusCode);
        var scored = await owner.PostAsJsonAsync($"/api/quizzes/{id}/answers", new { questionId, answer = " WRONG ", isCorrect = true, score = 99 });
        scored.EnsureSuccessStatusCode();
        var body = await scored.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(body.GetProperty("isCorrect").GetBoolean());
        Assert.Equal(0, body.GetProperty("quiz").GetProperty("score").GetInt32());
        Assert.Equal("purchase", body.GetProperty("correctAnswer").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await owner.PostAsJsonAsync($"/api/quizzes/{id}/answers", new { questionId, answer = "purchase" })).StatusCode);
        var words = await owner.GetFromJsonAsync<JsonElement>("/api/vocabularies");
        Assert.Equal(1, words.GetArrayLength());
        Assert.Equal(1, words[0].GetProperty("wrongCount").GetInt32());
    }

    [Fact]
    public async Task QuizListsSeparateCompletedAndResumableSessionsWithinOwnership()
    {
        using var factory = new ApiFactory();
        using var owner = factory.CreateApiClient();
        using var other = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(owner);
        await ApiFactory.RegisterAsync(other);
        (await owner.PostAsJsonAsync("/api/vocabularies", new { word = "purchase", meaning = "mua" })).EnsureSuccessStatusCode();
        var created = await owner.PostAsJsonAsync("/api/practice", new { mode = "REVERSE", size = 1 });
        var quiz = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id = quiz.GetProperty("id").GetString();
        var pending = (await owner.GetFromJsonAsync<List<QuizSummaryDto>>("/api/quizzes?completed=false", JsonOptions))!;
        Assert.Equal(id, Assert.Single(pending).Id.ToString());
        Assert.Null(pending[0].CompletedAt);
        Assert.Empty((await owner.GetFromJsonAsync<List<QuizSummaryDto>>("/api/quizzes", JsonOptions))!);
        Assert.Empty((await other.GetFromJsonAsync<List<QuizSummaryDto>>("/api/quizzes?completed=false", JsonOptions))!);
        (await owner.PostAsJsonAsync($"/api/quizzes/{id}/answers", new
        {
            questionId = quiz.GetProperty("questions")[0].GetProperty("id").GetString(), answer = "purchase"
        })).EnsureSuccessStatusCode();
        Assert.Empty((await owner.GetFromJsonAsync<List<QuizSummaryDto>>("/api/quizzes?completed=false", JsonOptions))!);
        var completed = Assert.Single((await owner.GetFromJsonAsync<List<QuizSummaryDto>>("/api/quizzes?completed=true", JsonOptions))!);
        Assert.Equal(id, completed.Id.ToString());
        Assert.NotNull(completed.CompletedAt);
    }

    [Fact]
    public async Task PracticeRejectsEmptyLibrariesAndInvalidSessionSettings()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(client);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/practice", new { size = 21 })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/practice", new { mode = "UNKNOWN" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/practice", new { mode = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/practice", new { mode = "FLASHCARD", size = 10 })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/practice", new { quizType = "WEEKLY" })).StatusCode);
    }
}
