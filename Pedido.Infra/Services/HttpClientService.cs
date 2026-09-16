using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using Pedido.Infra.DTOs;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Pedido.Infra.Services;

public class HttpClientService : IHttpClientService
{
    private const string BrasilApiCnpjBaseUrlVariavelAmbiente = "BRASIL_API_CNPJ_BASE_URL";
    private readonly IHttpClientFactory _httpClientFactory;

    public HttpClientService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    private async Task<BrasilApiCnpjResponse?> ObterDadosCnpj(string cnpj)
    {
        cnpj = StringHelper.ObterApenasNumeros(cnpj);

        if (string.IsNullOrWhiteSpace(cnpj) || cnpj.Length != 14)
            return null;

        var baseUrl = Environment.GetEnvironmentVariable(BrasilApiCnpjBaseUrlVariavelAmbiente);

        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new InvalidOperationException($"A variável de ambiente {BrasilApiCnpjBaseUrlVariavelAmbiente} não foi encontrada ou configurada.");

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl.TrimEnd('/')}/{cnpj}");

        request.Headers.UserAgent.ParseAdd("PedidoCertoAI/1.0");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        HttpResponseMessage response;

        try
        {
            response = await client.SendAsync(request);
        }
        catch (TaskCanceledException)
        {
            return null;
        }

        if (response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
            response.StatusCode == System.Net.HttpStatusCode.NotFound ||
            response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            return null;

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<BrasilApiCnpjResponse>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public async Task<Cliente> ObterDadosClienteCnpj(string cnpj)
    {
        cnpj = StringHelper.ObterApenasNumeros(cnpj);
        var dados = await ObterDadosCnpj(cnpj);

        var cliente = new Cliente
        {
            Cnpj = cnpj,
            RazaoSocial = dados?.RazaoSocial ?? string.Empty,
            Fantasia = dados?.NomeFantasia ?? string.Empty
        };

        if (dados != null)
        {
            AdicionarEnderecoCliente(cliente, dados);
            AdicionarContatosCliente(cliente, dados);
        }

        return cliente;
    }

    public async Task<Fornecedor> ObterDadosFornecedorCnpj(string cnpj)
    {
        cnpj = StringHelper.ObterApenasNumeros(cnpj);
        var dados = await ObterDadosCnpj(cnpj);

        var fornecedor = new Fornecedor
        {
            Cnpj = cnpj,
            RazaoSocial = dados?.RazaoSocial ?? string.Empty,
            Fantasia = dados?.NomeFantasia ?? string.Empty
        };

        if (dados != null)
        {
            AdicionarEnderecoFornecedor(fornecedor, dados);
            AdicionarContatosFornecedor(fornecedor, dados);
        }

        return fornecedor;
    }

    private static string MontarLogradouro(BrasilApiCnpjResponse dados)
    {
        var tipoLogradouro = (dados.DescricaoTipoLogradouro ?? string.Empty).Trim();
        var nomeLogradouro = (dados.Logradouro ?? string.Empty).Trim();

        return string.IsNullOrWhiteSpace(tipoLogradouro)
            ? nomeLogradouro
            : string.IsNullOrWhiteSpace(nomeLogradouro)
                ? tipoLogradouro
                : nomeLogradouro.StartsWith(tipoLogradouro, StringComparison.OrdinalIgnoreCase)
                    ? nomeLogradouro
                    : $"{tipoLogradouro} {nomeLogradouro}";
    }

    private static void AdicionarEnderecoCliente(Cliente cliente, BrasilApiCnpjResponse dados)
    {
        var logradouro = MontarLogradouro(dados);
        if (!string.IsNullOrWhiteSpace(logradouro))
        {
            cliente.Enderecos.Add(new ClienteEndereco
            {
                Logradouro = logradouro,
                Numero = dados.Numero ?? string.Empty,
                Complemento = dados.Complemento ?? string.Empty,
                Bairro = dados.Bairro ?? string.Empty,
                Cidade = dados.Municipio ?? string.Empty,
                Uf = dados.Uf ?? string.Empty,
                Cep = StringHelper.ObterApenasNumeros(dados.Cep),
                Default = true
            });
        }
    }

    private static void AdicionarEnderecoFornecedor(Fornecedor fornecedor, BrasilApiCnpjResponse dados)
    {
        var logradouro = MontarLogradouro(dados);
        if (!string.IsNullOrWhiteSpace(logradouro))
        {
            fornecedor.Enderecos.Add(new FornecedorEndereco
            {
                Logradouro = logradouro,
                Numero = dados.Numero ?? string.Empty,
                Complemento = dados.Complemento ?? string.Empty,
                Bairro = dados.Bairro ?? string.Empty,
                Cidade = dados.Municipio ?? string.Empty,
                Uf = dados.Uf ?? string.Empty,
                Cep = StringHelper.ObterApenasNumeros(dados.Cep),
                Default = true
            });
        }
    }

    private static void AdicionarContatosCliente(Cliente cliente, BrasilApiCnpjResponse dados)
    {
        if (!string.IsNullOrWhiteSpace(dados.DddTelefone1))
        {
            cliente.Contatos.Add(new ClienteContato
            {
                TipoContato = TipoContato.Telefone,
                Valor = dados.DddTelefone1,
                Default = true
            });
        }

        if (!string.IsNullOrWhiteSpace(dados.Email))
        {
            cliente.Contatos.Add(new ClienteContato
            {
                TipoContato = TipoContato.Email,
                Valor = dados.Email,
                Default = !cliente.Contatos.Any(x => x.TipoContato == TipoContato.Email)
            });
        }
    }

    private static void AdicionarContatosFornecedor(Fornecedor fornecedor, BrasilApiCnpjResponse dados)
    {
        if (!string.IsNullOrWhiteSpace(dados.DddTelefone1))
        {
            fornecedor.Contatos.Add(new FornecedorContato
            {
                TipoContato = TipoContato.Telefone,
                Valor = dados.DddTelefone1,
                Default = true
            });
        }

        if (!string.IsNullOrWhiteSpace(dados.Email))
        {
            fornecedor.Contatos.Add(new FornecedorContato
            {
                TipoContato = TipoContato.Email,
                Valor = dados.Email,
                Default = !fornecedor.Contatos.Any(x => x.TipoContato == TipoContato.Email)
            });
        }
    }
}