using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VocabMate.Api.Configuration;
using VocabMate.Api.Data;
using VocabMate.Api.Entities;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

var builder = WebApplication.CreateBuilder(args.Where(arg => arg != "--migrate").ToArray());

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(
    builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUser>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<VocabularyService>();
builder.Services.AddScoped<LearningProgressService>();
builder.Services.AddScoped<QuizService>();
builder.Services.AddScoped<StatisticsService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = jwt.Issuer,
        ValidateAudience = true, ValidAudience = jwt.Audience,
        ValidateLifetime = true, ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
{
    var origin = builder.Environment.IsProduction()
        ? ProductionSettings.FrontendOrigin(builder.Configuration["FrontendUrl"])
        : builder.Configuration["FrontendUrl"] ?? "http://localhost:5173";
    policy.WithOrigins(origin).AllowAnyHeader().AllowAnyMethod();
}));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Paste the access token returned by registration or login."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var app = builder.Build();
if (app.Environment.IsProduction())
    ProductionSettings.FrontendOrigin(app.Configuration["FrontendUrl"]);
if (string.IsNullOrWhiteSpace(app.Configuration.GetConnectionString("DefaultConnection")))
    throw new InvalidOperationException("Configure ConnectionStrings__DefaultConnection using environment variables or an ignored appsettings.Development.json.");
var jwtSettings = app.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
if (Encoding.UTF8.GetByteCount(jwtSettings.Key) < 32 || string.IsNullOrWhiteSpace(jwtSettings.Issuer) || string.IsNullOrWhiteSpace(jwtSettings.Audience))
    throw new InvalidOperationException("Configure Jwt__Key with a random key of at least 32 bytes, and Jwt__Issuer/Jwt__Audience.");
if (args.Contains("--migrate"))
{
    try
    {
        ProductionSettings.ValidateMigrationTarget(app.Configuration.GetConnectionString("DefaultConnection")!,
            app.Configuration["Migration:ExpectedHost"], app.Configuration["Migration:ExpectedDatabase"], app.Environment.IsProduction());
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (!await db.Database.CanConnectAsync()) throw new InvalidOperationException("Database unavailable.");
        var applied = await db.Database.GetAppliedMigrationsAsync();
        var pending = await db.Database.GetPendingMigrationsAsync();
        Console.WriteLine($"Applied migrations: {string.Join(", ", applied)}");
        Console.WriteLine($"Pending migrations: {string.Join(", ", pending)}");
        await db.Database.MigrateAsync();
        Console.WriteLine("Database migrations completed.");
        return;
    }
    catch (Exception exception)
    {
        // Provider exception messages can contain database or connection details.
        Console.Error.WriteLine($"Migration failed ({exception.GetType().Name}). Check the target, TLS, and database access in the hosting settings.");
        Environment.ExitCode = 1;
        return;
    }
}
app.UseMiddleware<ExceptionMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.Run();

public partial class Program;
