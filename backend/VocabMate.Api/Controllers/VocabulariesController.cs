using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabMate.Api.DTOs;
using VocabMate.Api.Entities;
using VocabMate.Api.Helpers;
using VocabMate.Api.Services;

namespace VocabMate.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/vocabularies")]
public class VocabulariesController(VocabularyService library, CurrentUser user) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<VocabularyDto>>> List([FromQuery] string? search,
        [FromQuery] Guid? topicId, [FromQuery] MasteryLevel? masteryLevel, [FromQuery] bool weakOnly = false) =>
        Ok(await library.ListAsync(user.Id, search, topicId, masteryLevel, weakOnly));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VocabularyDto>> Get(Guid id) => Ok(await library.GetAsync(user.Id, id));

    [HttpPost]
    public async Task<ActionResult<VocabularyDto>> Create(VocabularyRequest request)
    {
        var word = await library.CreateAsync(user.Id, request);
        return Created($"/api/vocabularies/{word.Id}", word);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VocabularyDto>> Update(Guid id, VocabularyRequest request) =>
        Ok(await library.UpdateAsync(user.Id, id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await library.DeleteAsync(user.Id, id);
        return NoContent();
    }

    [HttpPost("import")]
    public async Task<ActionResult<ImportResponse>> Import(ImportRequest request) =>
        Ok(await library.ImportAsync(user.Id, request));
}
