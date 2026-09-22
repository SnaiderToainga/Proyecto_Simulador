using Microsoft.EntityFrameworkCore;

public class SimuladorDbContext : DbContext
{
    public SimuladorDbContext(DbContextOptions<SimuladorDbContext> options) : base(options) 
    { 
    }
}