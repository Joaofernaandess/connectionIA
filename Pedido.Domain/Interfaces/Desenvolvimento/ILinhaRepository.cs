using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface ILinhaRepository
{
    Task<Guid> Cadastrar(Linha linha);
    Task<List<LinhaGetResponse>> Obter(LinhaGetRequest request);
    Task<Linha?> Obter(Guid linhaId);
    Task<int> Atualizar(Linha linha);
    Task<bool> VerificarLinhaExiste(string linha, Guid? clienteId, Guid ignoreId);
    Task<bool> VerificarLinhaExiste(Guid linhaId);
}
