using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using VocabMate.Api.Configuration;
using VocabMate.Api.DTOs;

namespace VocabMate.Tests;

public class ProductionHostingTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("http://localhost:5173")]
    [InlineData("https://localhost")]
    [InlineData("https://frontend.example.test/path")]
    [InlineData("https://frontend.example.test?token=example")]
    [InlineData("https://user:password@frontend.example.test")]
    [InlineData("https://frontend.example.test:8443")]
    public void ProductionRejectsInvalidFrontendOrigins(string? origin) =>
        Assert.Throws<InvalidOperationException>(() => ProductionSettings.FrontendOrigin(origin));

    [Fact]
    public void ProductionNormalizesAnHttpsOriginWithoutAllowingOtherDomains() =>
        Assert.Equal("https://frontend.example.test", ProductionSettings.FrontendOrigin("https://frontend.example.test/"));

    [Theory]
    [InlineData(null, "vocabmate", "VerifyFull")]
    [InlineData("different.example.test", "vocabmate", "VerifyFull")]
    [InlineData("database.example.test", "another_database", "VerifyFull")]
    [InlineData("database.example.test", "vocabmate", "Require")]
    public void MigrationRequiresTheExplicitTargetAndVerifiedTls(string? host, string database, string sslMode) =>
        Assert.Throws<InvalidOperationException>(() => ProductionSettings.ValidateMigrationTarget(
            $"Host=database.example.test;Database=vocabmate;SSL Mode={sslMode}", host, database, production: true));

    [Fact]
    public void MigrationAcceptsTheSelectedManagedDatabaseWithVerifiedTls() =>
        ProductionSettings.ValidateMigrationTarget("Host=database.example.test;Database=vocabmate;SSL Mode=VerifyFull",
            "database.example.test", "vocabmate", production: true);

    [Fact]
    public async Task ProductionDisablesSwaggerAndAllowsOnlyTheConfiguredBrowserOrigin()
    {
        using var factory = new ProductionFactory();
        using var client = factory.CreateApiClient();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/swagger/index.html")).StatusCode);

        using var allowed = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
        allowed.Headers.Add("Origin", "https://frontend.example.test");
        allowed.Headers.Add("Access-Control-Request-Method", "POST");
        allowed.Headers.Add("Access-Control-Request-Headers", "content-type");
        var allowedResponse = await client.SendAsync(allowed);
        Assert.Equal(HttpStatusCode.NoContent, allowedResponse.StatusCode);
        Assert.Equal("https://frontend.example.test", allowedResponse.Headers.GetValues("Access-Control-Allow-Origin").Single());

        using var rejected = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
        rejected.Headers.Add("Origin", "https://other.example.test");
        rejected.Headers.Add("Access-Control-Request-Method", "POST");
        var rejectedResponse = await client.SendAsync(rejected);
        Assert.False(rejectedResponse.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/health")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/vocabularies")).StatusCode);
    }

    [Fact]
    public async Task CreatedVocabularyLocationStaysRelativeBehindAnHttpsTerminatingProxy()
    {
        using var factory = new ProductionFactory();
        using var client = factory.CreateApiClient();
        await ApiFactory.RegisterAsync(client);
        var response = await client.PostAsJsonAsync("/api/vocabularies",
            new VocabularyRequest("available", "có sẵn", null, null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var word = await response.Content.ReadFromJsonAsync<JsonElement>();
        var location = response.Headers.Location!;
        Assert.False(location.IsAbsoluteUri);
        Assert.Equal($"/api/vocabularies/{word.GetProperty("id").GetGuid()}", location.OriginalString);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(location)).StatusCode);
    }

    private class ProductionFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseEnvironment("Production");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontendUrl"] = "https://frontend.example.test"
            }));
        }
    }
}
