using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IFornecedorEnderecoRepository
{
    Task<Guid> Cadastrar(FornecedorEndereco endereco);
    Task<List<FornecedorEndereco>> Obter(Guid fornecedorId);
    Task<int> Atualizar(FornecedorEndereco endereco);
    Task<int> Excluir(Guid fornecedorId, Guid fornecedorEnderecoId);
    Task<int> ExcluirPorFornecedor(Guid fornecedorId);
    Task<int> DefinirDefault(Guid fornecedorId, Guid fornecedorEnderecoId);
}