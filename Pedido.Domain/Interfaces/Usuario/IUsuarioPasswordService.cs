using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IUsuarioPasswordService
{
    string HashPassword(Usuario usuario, string senha);
}