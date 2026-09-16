using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IPedidoItemRepository
{
    Task<Guid> Cadastrar(PedidoItem item);
    Task<Guid> CadastrarGrade(PedidoItemGrade grade);
    Task<List<PedidoItemGetResponse>> Obter(Guid pedidoId);
    Task<int> Excluir(Guid pedidoId);
}
