using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IClienteEnderecoRepository
{
    Task<Guid> Cadastrar(ClienteEndereco endereco);
    Task<List<ClienteEndereco>> Obter(Guid clienteId);
    Task<int> Atualizar(ClienteEndereco endereco);
    Task<int> Excluir(Guid clienteId, Guid clienteEnderecoId);
    Task<int> ExcluirPorCliente(Guid clienteId);
    Task<int> DefinirDefault(Guid clienteId, Guid clienteEnderecoId);
}