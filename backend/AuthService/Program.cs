using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar puerto para AuthService
builder.WebHost.UseUrls("http://localhost:5001");

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

// 3. Inyectar Controladores
builder.Services.AddControllers();

// 4. Configurar JWT Compartido
var key = Encoding.ASCII.GetBytes("ClaveSecretaCompartida_SimuladorCreditoUTA_2026!");
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
        ValidateAudience = false
    };
});

var app = builder.Build();

// 5. Middlewares
app.UseCors("AllowVite");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();