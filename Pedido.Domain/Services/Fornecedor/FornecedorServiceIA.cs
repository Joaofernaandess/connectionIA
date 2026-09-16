using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class FornecedorServiceIA
{
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IFornecedorEnderecoRepository _fornecedorEnderecoRepository;
    private readonly IFornecedorContatoRepository _fornecedorContatoRepository;
    private readonly IHttpClientService _httpClientService;

    public FornecedorServiceIA(
        IFornecedorRepository fornecedorRepository,
        IFornecedorEnderecoRepository fornecedorEnderecoRepository,
        IFornecedorContatoRepository fornecedorContatoRepository,
        IHttpClientService httpClientService)
    {
        _fornecedorRepository = fornecedorRepository;
        _fornecedorEnderecoRepository = fornecedorEnderecoRepository;
        _fornecedorContatoRepository = fornecedorContatoRepository;
        _httpClientService = httpClientService;
    }

    public async Task<Fornecedor> CadastrarOuObterFornecedorPorAnaliseIA(FornecedorAnaliseIARequest analise)
    {
        var cnpj = StringHelper.ObterApenasNumeros(analise.Cnpj);

        var fornecedorExistente = string.IsNullOrWhiteSpace(cnpj)
            ? null
            : await _fornecedorRepository.ObterPorCnpj(cnpj);

        if (fornecedorExistente != null)
            return fornecedorExistente;

        var fornecedor = await _httpClientService.ObterDadosFornecedorCnpj(cnpj);
        if (string.IsNullOrWhiteSpace(fornecedor.RazaoSocial))
        {
            throw new ValidationException(new List<ValidationError>
            {
                new(nameof(Fornecedor.Cnpj), "CNPJ não encontrado na API de dados.")
            });
        }

        fornecedor.FornecedorId = Guid.NewGuid();
        fornecedor.Cnpj = cnpj;
        fornecedor.RazaoSocial = ObterPrimeiroValor(fornecedor.RazaoSocial);
        fornecedor.Fantasia = ObterPrimeiroValor(fornecedor.Fantasia);
        fornecedor.InscricaoEstadual = StringHelper.ObterApenasNumeros(fornecedor.InscricaoEstadual);

        fornecedor.FornecedorId = await _fornecedorRepository.Cadastrar(fornecedor);

        await CadastrarEnderecosPorAnaliseIA(fornecedor.FornecedorId, fornecedor.Enderecos ?? []);
        await CadastrarContatosPorAnaliseIA(fornecedor.FornecedorId, fornecedor.Contatos ?? []);

        return fornecedor;
    }

    private async Task CadastrarEnderecosPorAnaliseIA(Guid fornecedorId, List<FornecedorEndereco> enderecosAnalise)
    {
        await _fornecedorEnderecoRepository.ExcluirPorFornecedor(fornecedorId);
        var enderecosExistentes = await _fornecedorEnderecoRepository.Obter(fornecedorId);

        foreach (var enderecoAnalise in enderecosAnalise)
        {
            var endereco = new FornecedorEndereco
            {
                FornecedorEnderecoId = Guid.NewGuid(),
                FornecedorId = fornecedorId,
                Logradouro = enderecoAnalise.Logradouro ?? string.Empty,
                Numero = enderecoAnalise.Numero ?? string.Empty,
                Complemento = enderecoAnalise.Complemento ?? string.Empty,
                Bairro = enderecoAnalise.Bairro ?? string.Empty,
                Cidade = enderecoAnalise.Cidade ?? string.Empty,
                Uf = enderecoAnalise.Uf ?? string.Empty,
                Cep = enderecoAnalise.Cep ?? string.Empty,
                Default = enderecosExistentes.Count == 0
            };

            await _fornecedorEnderecoRepository.Cadastrar(endereco);
            enderecosExistentes.Add(endereco);
        }
    }

    private async Task CadastrarContatosPorAnaliseIA(Guid fornecedorId, List<FornecedorContato> contatosAnalise)
    {
        await _fornecedorContatoRepository.ExcluirPorFornecedor(fornecedorId);
        var contatosExistentes = await _fornecedorContatoRepository.Obter(fornecedorId);

        foreach (var contatoAnalise in contatosAnalise)
        {
            var contato = new FornecedorContato
            {
                FornecedorContatoId = Guid.NewGuid(),
                FornecedorId = fornecedorId,
                TipoContato = contatoAnalise.TipoContato,
                Valor = contatoAnalise.Valor ?? string.Empty,
                Default = !contatosExistentes.Any(x => x.TipoContato == contatoAnalise.TipoContato)
            };

            await _fornecedorContatoRepository.Cadastrar(contato);
            contatosExistentes.Add(contato);
        }
    }

    private static string ObterPrimeiroValor(params string[] valores)
    {
        return valores.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))?.Trim() ?? string.Empty;
    }
}
