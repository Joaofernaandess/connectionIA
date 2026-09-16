using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IReferenciaProdutoRepository
{
    Task<Guid> Cadastrar(ReferenciaProduto referenciaProduto);
    Task<List<ReferenciaProdutoGetResponse>> Obter(ReferenciaProdutoGetRequest request);
    Task<ReferenciaProdutoProximaResponse?> ObterProxima(Guid linhaProdutoId);
    Task<bool> VerificarReferenciaExiste(Guid linhaProdutoId, int numeroReferencia);
}
