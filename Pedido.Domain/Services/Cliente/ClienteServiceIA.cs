using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class ClienteServiceIA
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IClienteEnderecoRepository _clienteEnderecoRepository;
    private readonly IClienteContatoRepository _clienteContatoRepository;
    private readonly IPedidoAvaliacaoGestorRepository _pedidoAvaliacaoGestorRepository;
    private readonly IHttpClientService _httpClientService;

    public ClienteServiceIA(
        IClienteRepository clienteRepository,
        IClienteEnderecoRepository clienteEnderecoRepository,
        IClienteContatoRepository clienteContatoRepository,
        IPedidoAvaliacaoGestorRepository pedidoAvaliacaoGestorRepository,
        IHttpClientService httpClientService)
    {
        _clienteRepository = clienteRepository;
        _clienteEnderecoRepository = clienteEnderecoRepository;
        _clienteContatoRepository = clienteContatoRepository;
        _pedidoAvaliacaoGestorRepository = pedidoAvaliacaoGestorRepository;
        _httpClientService = httpClientService;
    }

    public async Task<Guid> CadastrarOuObterPorAnaliseIA(ClienteAnaliseIARequest analise)
    {
        var cliente = await CadastrarOuObterClientePorAnaliseIA(analise);

        return cliente.ClienteId;
    }

    public async Task<Cliente> CadastrarOuObterClientePorAnaliseIA(ClienteAnaliseIARequest analise)
    {
        var cnpj = StringHelper.ObterApenasNumeros(analise.Cnpj);

        var clienteExistente = string.IsNullOrWhiteSpace(cnpj)
            ? null
            : await _clienteRepository.ObterPorCnpj(cnpj);

        if (clienteExistente != null)
            return clienteExistente;

        var cliente = await _httpClientService.ObterDadosClienteCnpj(cnpj);
        if (string.IsNullOrWhiteSpace(cliente.RazaoSocial))
        {
            throw new ValidationException(new List<ValidationError>
            {
                new(nameof(Cliente.Cnpj), "CNPJ não encontrado na API de dados.")
            });
        }

        cliente.ClienteId = Guid.NewGuid();
        cliente.Cnpj = cnpj;
        cliente.RazaoSocial = ObterPrimeiroValor(cliente.RazaoSocial);
        cliente.Fantasia = ObterPrimeiroValor(cliente.Fantasia);
        cliente.InscricaoEstadual = StringHelper.ObterApenasNumeros(cliente.InscricaoEstadual);

        cliente.ClienteId = await _clienteRepository.Cadastrar(cliente);

        await CadastrarEnderecosPorAnaliseIA(cliente.ClienteId, cliente.Enderecos ?? []);
        await CadastrarContatosPorAnaliseIA(cliente.ClienteId, cliente.Contatos ?? []);

        return cliente;
    }

    public async Task<List<string>> ObterPromptsPorCnpj(string cnpj)
    {
        try
        {
            cnpj = StringHelper.ObterApenasNumeros(cnpj);

            if (string.IsNullOrWhiteSpace(cnpj))
                return new List<string>();

            return await _pedidoAvaliacaoGestorRepository.ObterPromptsPorClienteCnpj(cnpj);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter prompts do cliente: {ex.Message}");
        }
    }

    private async Task CadastrarEnderecosPorAnaliseIA(Guid clienteId, List<ClienteEndereco> enderecosAnalise)
    {
        await _clienteEnderecoRepository.ExcluirPorCliente(clienteId);
        var enderecosExistentes = await _clienteEnderecoRepository.Obter(clienteId);

        foreach (var enderecoAnalise in enderecosAnalise)
        {
            var endereco = new ClienteEndereco
            {
                ClienteEnderecoId = Guid.NewGuid(),
                ClienteId = clienteId,
                Logradouro = enderecoAnalise.Logradouro ?? string.Empty,
                Numero = enderecoAnalise.Numero ?? string.Empty,
                Complemento = enderecoAnalise.Complemento ?? string.Empty,
                Bairro = enderecoAnalise.Bairro ?? string.Empty,
                Cidade = enderecoAnalise.Cidade ?? string.Empty,
                Uf = enderecoAnalise.Uf ?? string.Empty,
                Cep = enderecoAnalise.Cep ?? string.Empty,
                Default = enderecosExistentes.Count == 0
            };

            await _clienteEnderecoRepository.Cadastrar(endereco);
            enderecosExistentes.Add(endereco);
        }
    }

    private async Task CadastrarContatosPorAnaliseIA(Guid clienteId, List<ClienteContato> contatosAnalise)
    {
        await _clienteContatoRepository.ExcluirPorCliente(clienteId);
        var contatosExistentes = await _clienteContatoRepository.Obter(clienteId);

        foreach (var contatoAnalise in contatosAnalise)
        {
            var contato = new ClienteContato
            {
                ClienteContatoId = Guid.NewGuid(),
                ClienteId = clienteId,
                TipoContato = contatoAnalise.TipoContato,
                Valor = contatoAnalise.Valor ?? string.Empty,
                Default = !contatosExistentes.Any(x => x.TipoContato == contatoAnalise.TipoContato)
            };

            await _clienteContatoRepository.Cadastrar(contato);
            contatosExistentes.Add(contato);
        }
    }

    private static string ObterPrimeiroValor(params string[] valores)
    {
        return valores.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))?.Trim() ?? string.Empty;
    }
}
