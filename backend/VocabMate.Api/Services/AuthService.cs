using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VocabMate.Api.Configuration;
using VocabMate.Api.Data;
using VocabMate.Api.DTOs;
using VocabMate.Api.Entities;
using VocabMate.Api.Helpers;

namespace VocabMate.Api.Services;

public class AuthService(AppDbContext db, IPasswordHasher<User> hasher, IOptions<JwtSettings> jwt)
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length == 0) throw new ApiException(400, "Name cannot be blank.");
        if (string.IsNullOrWhiteSpace(request.Password)) throw new ApiException(400, "Password cannot be blank.");
        var email = request.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();
        if (await db.Users.AnyAsync(x => x.NormalizedEmail == normalizedEmail))
            throw new ApiException(409, "An account with this email already exists.");
        var user = new User { Name = name, Email = email, NormalizedEmail = normalizedEmail };
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return IssueToken(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await db.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);
        if (user == null || hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            throw new ApiException(401, "Email or password is incorrect.");
        return IssueToken(user);
    }

    public async Task<UserDto> GetUserAsync(Guid userId)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == userId)
            ?? throw new ApiException(401, "Your account is unavailable. Please sign in again.");
        return ToDto(user);
    }

    private AuthResponse IssueToken(User user)
    {
        var settings = jwt.Value;
        var expiresAt = DateTime.UtcNow.AddHours(8);
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience,
            [new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())],
            notBefore: DateTime.UtcNow, expires: expiresAt,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)), SecurityAlgorithms.HmacSha256));
        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), expiresAt, ToDto(user));
    }

    private static UserDto ToDto(User user) => new(user.Id, user.Name, user.Email, user.CreatedAt);
}
