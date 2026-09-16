using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IPedidoAtualizacaoNotifier
{
    Task NotificarPedidoAtualizado(Guid pedidoId, PedidoStatus status);
}
