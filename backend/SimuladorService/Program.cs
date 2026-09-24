using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SimuladorService.Data;
using SimuladorService.Services; // Namespace verificado

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar puerto para SimuladorService
builder.WebHost.UseUrls("http://localhost:5002");

// 2. Habilitar CORS para Vite
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVite", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. Inyección de DbContext y Servicio de Dominio
builder.Services.AddDbContext<SimuladorDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Inyectamos explícitamente usando el namespace requerido
builder.Services.AddScoped<SimuladorService.Services.SimuladorService>();

builder.Services.AddControllers();

// 4. Configurar JWT Compartido para Validar el token enviado por React
var keyStr = "ClaveSecretaCompartida_SimuladorCreditoUTA_2026!";
var key = Encoding.UTF8.GetBytes(keyStr);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero // Evita problemas de desfase de reloj
    };
});

var app = builder.Build();

// 5. Middlewares
app.UseCors("AllowVite");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();