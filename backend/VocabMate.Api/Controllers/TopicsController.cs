using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabMate.Api.DTOs;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/topics")]
public class TopicsController(VocabularyService library, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TopicDto>>> List() => Ok(await library.ListTopicsAsync(user.Id));

    [HttpPost]
    public async Task<ActionResult<TopicDto>> Create(TopicRequest request) =>
        StatusCode(201, await library.CreateTopicAsync(user.Id, request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TopicDto>> Update(Guid id, TopicRequest request) =>
        Ok(await library.UpdateTopicAsync(user.Id, id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await library.DeleteTopicAsync(user.Id, id);
        return NoContent();
    }
}
