using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IReferenciaDesenhoRepository
{
    Task<ReferenciaDesenhoResponse> Cadastrar(ReferenciaDesenho desenho);
    Task<ReferenciaDesenhoResponse?> Obter(Guid referenciaDesenhoId);
    Task<ReferenciaDesenhoResponse?> ObterDesenhoOriginal(Guid referenciaId);
    Task<List<ReferenciaDesenhoResponse>> ObterPorReferencia(Guid referenciaId);
}
