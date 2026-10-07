using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabMate.Api.DTOs;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth, CurrentUser user) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request) =>
        StatusCode(201, await auth.RegisterAsync(request));

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request) => Ok(await auth.LoginAsync(request));

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me() => Ok(await auth.GetUserAsync(user.Id));
}
