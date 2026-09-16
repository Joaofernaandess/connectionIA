using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IAuthTokenService
{
    string GerarToken(AuthUsuario usuario);
}