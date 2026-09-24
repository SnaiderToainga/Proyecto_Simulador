using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimuladorService.Migrations
{
    /// <inheritdoc />
    public partial class AgregarHistorial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Simulaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoCredito = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlazoMeses = table.Column<int>(type: "int", nullable: false),
                    SistemaAmortizacion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CuotaReferencial = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPagar = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Simulaciones", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Simulaciones");
        }
    }
}
