using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabMate.Api.DTOs;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/statistics")]
public class StatisticsController(StatisticsService statistics, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public Task<StatisticsDto> Get() => statistics.Get(user.Id);
}
