using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VocabMate.Api.Data;
using VocabMate.Api.DTOs;

namespace VocabMate.Tests;

public class AuthTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task RegisterHashesPasswordAndReturnsAuthenticatedIdentity()
    {
        using var client = factory.CreateApiClient();
        var auth = await ApiFactory.RegisterAsync(client);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.Users.SingleAsync(x => x.Id == auth.User.Id);
        Assert.NotEqual("Practice123!", saved.PasswordHash);
        Assert.True(auth.ExpiresAt > DateTime.UtcNow.AddHours(7));
        var identity = await client.GetFromJsonAsync<UserDto>("/api/auth/me");
        Assert.Equal(auth.User.Id, identity!.Id);
    }

    [Fact]
    public async Task LoginAcceptsEmailCaseAndRejectsWrongPassword()
    {
        using var client = factory.CreateApiClient();
        var email = $"student{Guid.NewGuid():N}@example.com";
        var auth = await ApiFactory.RegisterAsync(client, email);
        var good = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email.ToUpperInvariant(), "Practice123!"));
        Assert.Equal(HttpStatusCode.OK, good.StatusCode);
        Assert.Equal(auth.User.Id, (await good.Content.ReadFromJsonAsync<AuthResponse>())!.User.Id);
        var bad = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Incorrect123!"));
        Assert.Equal(HttpStatusCode.Unauthorized, bad.StatusCode);
    }

    [Fact]
    public async Task DuplicateEmailAndInvalidInputAreRejected()
    {
        using var client = factory.CreateApiClient();
        var email = $"student{Guid.NewGuid():N}@example.com";
        await ApiFactory.RegisterAsync(client, email);
        var duplicate = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Another", email.ToUpperInvariant(), "Practice123!"));
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        var invalid = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(" ", "not-email", "short"));
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }

    [Fact]
    public async Task MissingOrTamperedTokensCannotAccessProtectedRoutes()
    {
        using var client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/vocabularies")).StatusCode);
        var auth = await ApiFactory.RegisterAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token + "bad");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }
}
