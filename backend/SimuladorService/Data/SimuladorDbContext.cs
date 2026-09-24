using Microsoft.EntityFrameworkCore;
using SimuladorService.Models;

namespace SimuladorService.Data
{
    public class SimuladorDbContext : DbContext
    {
        public SimuladorDbContext(DbContextOptions<SimuladorDbContext> options) : base(options)
        {
        }

        // Nueva tabla añadida
        public DbSet<SimulacionRegistro> Simulaciones { get; set; }
    }
}