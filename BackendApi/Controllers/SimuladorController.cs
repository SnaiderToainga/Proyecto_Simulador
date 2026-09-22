using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/simulador")]
[ApiController]
[Authorize] // Esta etiqueta exige el JWT
public class SimuladorController : ControllerBase
{
    private readonly SimuladorService _service;
    
    public SimuladorController(SimuladorService service) 
    { 
        _service = service; 
    }

    public class SimulacionRequest 
    { 
        public decimal Monto { get; set; } 
        public int PlazoMeses { get; set; } 
        public TipoCredito Tipo { get; set; } 
        public SistemaAmortizacion Sistema { get; set; } 
    }

    [HttpPost]
    public IActionResult Simular([FromBody] SimulacionRequest request)
    {
        var tabla = _service.CalcularAmortizacion(
            request.Monto, 
            request.PlazoMeses, 
            request.Tipo, 
            request.Sistema
        );
        return Ok(tabla);
    }
}