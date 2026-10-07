using Microsoft.EntityFrameworkCore;

namespace VocabMate.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
