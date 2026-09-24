using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using SimuladorService.Data;
using SimuladorService.Models;
using SimuladorService.Services;

namespace SimuladorService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Protege ambos endpoints (simulador e historial)
    public class SimuladorController : ControllerBase
    {
        private readonly Services.SimuladorService _simuladorService;
        private readonly SimuladorDbContext _context;

        // Inyectamos la lógica de cálculo y la conexión a la base de datos
        public SimuladorController(Services.SimuladorService simuladorService, SimuladorDbContext context)
        {
            _simuladorService = simuladorService;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CalcularSimulacion([FromBody] SimulacionRequest request)
        {
            // 1. Ejecutar el cálculo matemático en memoria (importado desde tu servicio)
            var tablaAmortizacion = _simuladorService.CalcularAmortizacion(
                request.Monto, 
                request.PlazoMeses, 
                (TipoCredito)request.Tipo, 
                (SistemaAmortizacion)request.Sistema
            );

            // 2. Calcular los totales de la proyección para el guardado en base de datos
            decimal totalInteres = tablaAmortizacion.Sum(x => x.Interes);
            decimal totalSeguro = tablaAmortizacion.Sum(x => x.Seguro);
            decimal capital = tablaAmortizacion.Sum(x => x.Capital);
            
            // 3. Crear el objeto de registro de base de datos
            var registro = new SimulacionRegistro
            {
                Fecha = DateTime.UtcNow, // Marca de tiempo del servidor
                TipoCredito = ((TipoCredito)request.Tipo).ToString(),
                Monto = request.Monto,
                PlazoMeses = request.PlazoMeses,
                SistemaAmortizacion = ((SistemaAmortizacion)request.Sistema).ToString(),
                CuotaReferencial = tablaAmortizacion.FirstOrDefault()?.Cuota ?? 0,
                TotalPagar = capital + totalInteres + totalSeguro
            };

            // 4. Guardar en SQL Server Express de forma asíncrona
            _context.Simulaciones.Add(registro);
            await _context.SaveChangesAsync();

            // 5. Devolver la tabla completa al Frontend para pintar la pantalla y generar el PDF
            return Ok(tablaAmortizacion);
        }

        [HttpGet("historial")]
        public async Task<IActionResult> GetHistorial()
        {
            // Retorna las últimas 5 simulaciones registradas, ordenadas de la más reciente a la más antigua
            var historial = await _context.Simulaciones
                                          .OrderByDescending(s => s.Fecha)
                                          .Take(5)
                                          .ToListAsync();
                                          
            return Ok(historial);
        }
    }

    // Modelo de entrada para el POST
    public class SimulacionRequest
    {
        public decimal Monto { get; set; }
        public int PlazoMeses { get; set; }
        public int Tipo { get; set; }
        public int Sistema { get; set; }
    }
}