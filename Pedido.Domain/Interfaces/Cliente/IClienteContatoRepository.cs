using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IClienteContatoRepository
{
    Task<Guid> Cadastrar(ClienteContato contato);
    Task<List<ClienteContato>> Obter(Guid clienteId);
    Task<int> Atualizar(ClienteContato contato);
    Task<int> Excluir(Guid clienteId, Guid clienteContatoId);
    Task<int> ExcluirPorCliente(Guid clienteId);
    Task<int> DefinirDefault(Guid clienteId, Guid clienteContatoId);
}