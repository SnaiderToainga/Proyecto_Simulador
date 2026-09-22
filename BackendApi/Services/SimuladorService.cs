using System;
using System.Collections.Generic;

public enum TipoCredito { Preciso, HipotecarioVivienda, ViviendaInteresPublico, EducacionSuperior }
public enum SistemaAmortizacion { Frances, Aleman }

public class CuotaAmortizacion
{
    public int Mes { get; set; }
    public decimal Cuota { get; set; }
    public decimal Interes { get; set; }
    public decimal Capital { get; set; }
    public decimal Seguro { get; set; }
    public decimal Saldo { get; set; }
}

public class SimuladorService
{
    public List<CuotaAmortizacion> CalcularAmortizacion(decimal monto, int plazoMeses, TipoCredito tipo, SistemaAmortizacion sistema)
    {
        // Tasa anual según producto
        decimal tasaAnual = tipo switch
        {
            TipoCredito.Preciso => 0.156m, 
            TipoCredito.HipotecarioVivienda => 0.085m,
            TipoCredito.ViviendaInteresPublico => 0.0499m,
            TipoCredito.EducacionSuperior => 0.095m,
            _ => throw new ArgumentException("Tipo de crédito no válido")
        };

        var tasaInteresMensual = tasaAnual / 12m;
        
        // Tasa de desgravamen aproximada (0.0704% mensual sobre saldo)
        var tasaSeguroMensual = 0.000704m; 
        
        var tabla = new List<CuotaAmortizacion>();
        decimal saldo = monto;

        if (sistema == SistemaAmortizacion.Frances)
        {
            // Cuota fija pura (solo capital e interés)
            decimal cuotaFija = monto * (tasaInteresMensual * (decimal)Math.Pow(1 + (double)tasaInteresMensual, plazoMeses)) / 
                                        (decimal)(Math.Pow(1 + (double)tasaInteresMensual, plazoMeses) - 1);
            
            for (int i = 1; i <= plazoMeses; i++)
            {
                decimal interes = saldo * tasaInteresMensual;
                decimal capital = cuotaFija - interes;
                decimal seguro = saldo * tasaSeguroMensual;
                
                saldo -= capital;
                if (saldo < 0) saldo = 0;

                // La cuota total del mes suma la cuota fija base más el seguro del mes (el seguro disminuye con el saldo)
                decimal cuotaTotal = capital + interes + seguro;

                tabla.Add(new CuotaAmortizacion 
                { 
                    Mes = i, 
                    Cuota = Math.Round(cuotaTotal, 2), 
                    Interes = Math.Round(interes, 2), 
                    Capital = Math.Round(capital, 2), 
                    Seguro = Math.Round(seguro, 2),
                    Saldo = Math.Round(saldo, 2) 
                });
            }
        }
        else if (sistema == SistemaAmortizacion.Aleman)
        {
            // Capital constante en todos los meses
            decimal capitalFijo = monto / plazoMeses;

            for (int i = 1; i <= plazoMeses; i++)
            {
                decimal interes = saldo * tasaInteresMensual;
                decimal seguro = saldo * tasaSeguroMensual;
                
                // La cuota total del mes suma capital fijo + intereses (decrecientes) + seguro (decreciente)
                decimal cuotaTotal = capitalFijo + interes + seguro;
                
                saldo -= capitalFijo;
                if (saldo < 0) saldo = 0;

                tabla.Add(new CuotaAmortizacion 
                { 
                    Mes = i, 
                    Cuota = Math.Round(cuotaTotal, 2), 
                    Interes = Math.Round(interes, 2), 
                    Capital = Math.Round(capitalFijo, 2), 
                    Seguro = Math.Round(seguro, 2),
                    Saldo = Math.Round(saldo, 2) 
                });
            }
        }

        return tabla;
    }
}