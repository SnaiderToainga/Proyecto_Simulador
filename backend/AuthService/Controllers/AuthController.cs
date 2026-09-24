namespace AuthService.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    
    public AuthController(IConfiguration config) 
    { 
        _config = config; 
    }

    public class LoginRequest 
    { 
        public string Username { get; set; } 
        public string Password { get; set; } 
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // Usuario quemado para pruebas de JWT
        if (request.Username == "admin" && request.Password == "12345")
        {
            var keyStr = "ClaveSecretaCompartida_SimuladorCreditoUTA_2026!";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            var token = new JwtSecurityToken(
                issuer: "SimuladorApp",
                audience: "SimuladorAppUsers",
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );
            
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }
        return Unauthorized("Credenciales inválidas");
    }
}