using Microsoft.EntityFrameworkCore;

namespace Waymates.Infrastructure.Persistence;

public class WaymatesDbContext : DbContext
{
    public WaymatesDbContext(DbContextOptions<WaymatesDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}