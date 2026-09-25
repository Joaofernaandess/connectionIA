using System.Security.Claims;
using Pedido.Domain.Models;

namespace Pedido.Server.AuthServices;

public static class AuditoriaUsuarioHttpContext
{
    public static AuditoriaUsuario ObterUsuarioAuditoria(this HttpContext context)
    {
        var usuarioIdTexto = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        return new AuditoriaUsuario
        {
            UsuarioId = Guid.TryParse(usuarioIdTexto, out var usuarioId) ? usuarioId : null,
            Username = context.User.FindFirstValue(ClaimTypes.Name) ?? string.Empty,
            Nome = context.User.FindFirstValue("Nome") ?? string.Empty
        };
    }
}
