using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IHttpClientService
{
    Task<Cliente> ObterDadosClienteCnpj(string cnpj);
    Task<Fornecedor> ObterDadosFornecedorCnpj(string cnpj);
}
