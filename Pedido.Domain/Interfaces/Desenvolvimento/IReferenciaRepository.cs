using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IReferenciaRepository
{
    Task<Guid> Cadastrar(Referencia referencia);
    Task<ReferenciaCorResponse> CadastrarCor(ReferenciaCor referenciaCor);
    Task<List<ReferenciaGetResponse>> Obter(ReferenciaGetRequest request);
    Task<Referencia?> Obter(Guid referenciaId);
    Task<List<ReferenciaCorResponse>> ObterCores(Guid referenciaId);
    Task<ReferenciaProximaResponse?> ObterProxima(Guid linhaId);
    Task<int> Atualizar(Referencia referencia);
    Task<bool> VerificarReferenciaCorExiste(Guid referenciaId, Guid corId);
    Task<bool> VerificarReferenciaExiste(Guid linhaId, int numeroReferencia);
    Task<bool> VerificarReferenciaExiste(Guid referenciaId);
}
