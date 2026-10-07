using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabMate.Api.DTOs;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/practice")]
public class PracticeController(QuizService quizzes, CurrentUser user) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<QuizSessionDto>> Start(StartPracticeRequest request)
    {
        var quiz = await quizzes.Start(user.Id, request);
        return Created($"/api/quizzes/{quiz.Id}", quiz);
    }

    [HttpGet("weekly")]
    public Task<WeeklyReviewDto> Weekly() => quizzes.Weekly(user.Id);
}
