using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VocabMate.Api.Helpers;

namespace VocabMate.Api.Configuration;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            var (status, detail) = exception switch
            {
                ApiException api => (api.StatusCode, api.Message),
                DbUpdateConcurrencyException => (409, "This item changed while you were working. Refresh and try again."),
                DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } }
                    => (409, "An item with these details already exists."),
                DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation } }
                    => (409, "This item is still in use, or a related item no longer exists."),
                _ => (500, "An unexpected error occurred. Please try again.")
            };
            // Do not log exception messages: database errors can include personal data.
            if (status == 500) logger.LogError("Request failed ({ExceptionType}); trace {TraceId}.", exception.GetType().Name, context.TraceIdentifier);
            context.Response.StatusCode = status;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = status,
                Title = status == 500 ? "Server error" : "Request failed",
                Detail = detail,
                Instance = context.Request.Path
            }, options: null, contentType: "application/problem+json", cancellationToken: context.RequestAborted);
        }
    }
}
