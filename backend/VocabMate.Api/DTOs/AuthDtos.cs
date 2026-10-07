using System.ComponentModel.DataAnnotations;

namespace VocabMate.Api.DTOs;

public record RegisterRequest(
    [Required, StringLength(80, MinimumLength = 1)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128, MinimumLength = 8)] string Password);

public record LoginRequest(
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128)] string Password);

public record UserDto(Guid Id, string Name, string Email, DateTime CreatedAt);
public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);
