using Microsoft.IdentityModel.Tokens;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Pedido.Server.AuthServices;

public class AuthTokenService : IAuthTokenService
{
    public string GerarToken(AuthUsuario usuario)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var keyString = Environment.GetEnvironmentVariable("zenite_jwt_auth") ?? throw new InvalidOperationException("A variável de ambiente zenite_jwt_auth não foi encontrada ou configurada.");
        var key = Encoding.ASCII.GetBytes(keyString);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
                new Claim(ClaimTypes.Name, usuario.Username),
                new Claim("Nome", usuario.Nome),
                new Claim(ClaimTypes.Role, usuario.Perfil.ToString()),
                new Claim("CadastroCompleto", usuario.CadastroCompleto.ToString()),
                new Claim("JornadaUsuario", usuario.JornadaUsuario.ToString())
            }),
            Expires = DateTimeHelper.SaoPaulo().AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
