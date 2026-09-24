using System;
using System.ComponentModel.DataAnnotations;

namespace SimuladorService.Models
{
    public class SimulacionRegistro
    {
        [Key]
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string TipoCredito { get; set; }
        public decimal Monto { get; set; }
        public int PlazoMeses { get; set; }
        public string SistemaAmortizacion { get; set; }
        public decimal CuotaReferencial { get; set; }
        public decimal TotalPagar { get; set; }
    }
}