namespace VocabMate.Api.Configuration;

public class JwtSettings
{
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "VocabMate";
    public string Audience { get; set; } = "VocabMate.Web";
}
