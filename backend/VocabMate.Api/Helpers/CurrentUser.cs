using System.Security.Claims;

namespace VocabMate.Api.Helpers;

public class CurrentUser(IHttpContextAccessor accessor)
{
    public Guid Id => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue("sub"), out var id)
        ? id
        : throw new ApiException(StatusCodes.Status401Unauthorized, "Please sign in to continue.");
}
