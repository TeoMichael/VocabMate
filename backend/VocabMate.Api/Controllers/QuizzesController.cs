using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabMate.Api.DTOs;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/quizzes")]
public class QuizzesController(QuizService quizzes, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public Task<List<QuizSummaryDto>> History([FromQuery] bool completed = true) => quizzes.History(user.Id, completed);
    [HttpGet("{id:guid}")]
    public Task<QuizSessionDto> Get(Guid id) => quizzes.Get(user.Id, id);
    [HttpPost("{id:guid}/answers")]
    public Task<AnswerResponse> Answer(Guid id, AnswerRequest request) => quizzes.Answer(user.Id, id, request);
    [HttpPost("{id:guid}/questions/{questionId:guid}/reveal")]
    public Task<RevealResponse> Reveal(Guid id, Guid questionId) => quizzes.Reveal(user.Id, id, questionId);
}
