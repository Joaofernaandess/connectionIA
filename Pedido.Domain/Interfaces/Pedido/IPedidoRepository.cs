using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IPedidoRepository
{
    Task<Guid> CadastrarPedido(Models.Pedido pedido);
    Task<List<PedidoGetResponse>> Obter(PedidoGetRequest request);
    Task<PedidoGetResponse?> Obter(Guid pedidoId);
    Task<int> Atualizar(Models.Pedido pedido);
    Task<int> AtualizarStatus(Guid pedidoId, PedidoStatus status);
}
