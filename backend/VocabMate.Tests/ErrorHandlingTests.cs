using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using VocabMate.Api.Configuration;

namespace VocabMate.Tests;

public class ErrorHandlingTests
{
    [Fact]
    public async Task UnexpectedErrorsReturnProblemDetailsWithoutPrivateExceptionData()
    {
        const string privateDetail = "Sensitive internal database detail";
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/statistics";
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionMiddleware(
            _ => throw new InvalidOperationException(privateDetail),
            NullLogger<ExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
        context.Response.Body.Position = 0;
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(privateDetail, body);
        using var json = JsonDocument.Parse(body);
        Assert.Equal(500, json.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("An unexpected error occurred. Please try again.", json.RootElement.GetProperty("detail").GetString());
        Assert.Equal("/api/statistics", json.RootElement.GetProperty("instance").GetString());
    }
}
