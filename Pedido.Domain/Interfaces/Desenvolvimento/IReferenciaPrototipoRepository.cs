using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IReferenciaPrototipoRepository
{
    Task<ReferenciaPrototipoResponse> Cadastrar(ReferenciaPrototipo referenciaPrototipo);
    Task<ReferenciaPrototipoResponse?> ObterPorReferenciaCor(Guid referenciaId, Guid corId);
}
