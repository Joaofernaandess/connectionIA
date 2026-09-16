using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IFornecedorRepository
{
    Task<Guid> Cadastrar(Fornecedor fornecedor);
    Task<List<FornecedorGetResponse>> Obter(FornecedorGetRequest request);
    Task<Fornecedor?> Obter(Guid fornecedorId);
    Task<int> Atualizar(Fornecedor fornecedor);
    Task<Fornecedor?> ObterPorCnpj(string cnpj);
    Task<bool> VerificarFornecedorExiste(string cnpj, Guid ignoreId);
    Task<bool> VerificarFornecedorExiste(Guid fornecedorId);
}