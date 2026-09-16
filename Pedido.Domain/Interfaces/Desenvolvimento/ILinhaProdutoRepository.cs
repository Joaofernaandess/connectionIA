using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface ILinhaProdutoRepository
{
    Task<Guid> Cadastrar(LinhaProduto linhaProduto);
    Task<List<LinhaProdutoGetResponse>> Obter(LinhaProdutoGetRequest request);
    Task<LinhaProduto?> Obter(Guid linhaProdutoId);
    Task<int> Atualizar(LinhaProduto linhaProduto);
    Task<bool> VerificarLinhaExiste(int linha, Guid? clienteId, Guid ignoreId);
    Task<bool> VerificarLinhaProdutoExiste(Guid linhaProdutoId);
}
