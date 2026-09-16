using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IFornecedorContatoRepository
{
    Task<Guid> Cadastrar(FornecedorContato contato);
    Task<List<FornecedorContato>> Obter(Guid fornecedorId);
    Task<int> Atualizar(FornecedorContato contato);
    Task<int> Excluir(Guid fornecedorId, Guid fornecedorContatoId);
    Task<int> ExcluirPorFornecedor(Guid fornecedorId);
    Task<int> DefinirDefault(Guid fornecedorId, Guid fornecedorContatoId);
}