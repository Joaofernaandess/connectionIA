using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IClienteRepository
{
    Task<Guid> Cadastrar(Cliente cliente);
    Task<List<ClienteGetResponse>> Obter(ClienteGetRequest request);
    Task<Cliente?> Obter(Guid clienteId);
    Task<int> Atualizar(Cliente cliente);
    Task<Cliente?> ObterPorCnpj(string cnpj);
    Task<bool> VerificarClienteExiste(string cnpj, Guid ignoreId);
    Task<bool> VerificarClienteExiste(Guid clienteId);
}