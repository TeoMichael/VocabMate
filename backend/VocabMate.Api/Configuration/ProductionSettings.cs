using Npgsql;

namespace VocabMate.Api.Configuration;

public static class ProductionSettings
{
    public static string FrontendOrigin(string? value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != "https" ||
            !uri.IsDefaultPort || uri.AbsolutePath != "/" || uri.Query != "" || uri.Fragment != "" ||
            uri.UserInfo != "" || uri.IsLoopback)
            throw new InvalidOperationException("Set FrontendUrl to the exact public HTTPS frontend origin.");
        return uri.GetLeftPart(UriPartial.Authority);
    }

    public static void ValidateMigrationTarget(string connectionString, string? expectedHost, string? expectedDatabase, bool production)
    {
        if (string.IsNullOrWhiteSpace(expectedHost) || string.IsNullOrWhiteSpace(expectedDatabase))
            throw new InvalidOperationException("Set Migration__ExpectedHost and Migration__ExpectedDatabase before running migrations.");
        var connection = new NpgsqlConnectionStringBuilder(connectionString);
        if (!string.Equals(connection.Host, expectedHost, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(connection.Database, expectedDatabase, StringComparison.Ordinal))
            throw new InvalidOperationException("The configured database does not match the explicitly selected migration target.");
        if (production && connection.SslMode != SslMode.VerifyFull)
            throw new InvalidOperationException("Production migrations require SSL Mode=VerifyFull.");
    }
}
