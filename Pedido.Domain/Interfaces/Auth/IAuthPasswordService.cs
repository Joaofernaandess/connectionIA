using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IAuthPasswordService
{
    string HashPassword(AuthUsuario usuario, string senha);
    bool VerifyHashedPassword(AuthUsuario usuario, string senhaHash, string senha);
}