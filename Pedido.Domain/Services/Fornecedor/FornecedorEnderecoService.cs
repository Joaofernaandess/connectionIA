using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class FornecedorEnderecoService : BaseService
{
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IFornecedorEnderecoRepository _fornecedorEnderecoRepository;

    public FornecedorEnderecoService(
        IFornecedorRepository fornecedorRepository,
        IFornecedorEnderecoRepository fornecedorEnderecoRepository)
    {
        _fornecedorRepository = fornecedorRepository;
        _fornecedorEnderecoRepository = fornecedorEnderecoRepository;
    }

    public async Task<Guid> Cadastrar(Guid fornecedorId, FornecedorEnderecoPostRequest enderecoRequest)
    {
        try
        {
            await ValidarEndereco(fornecedorId, enderecoRequest);
            var enderecos = await _fornecedorEnderecoRepository.Obter(fornecedorId);

            var endereco = new FornecedorEndereco
            {
                FornecedorEnderecoId = Guid.NewGuid(),
                FornecedorId = fornecedorId,
                Logradouro = enderecoRequest.Logradouro,
                Numero = enderecoRequest.Numero,
                Complemento = enderecoRequest.Complemento,
                Bairro = enderecoRequest.Bairro,
                Cidade = enderecoRequest.Cidade,
                Uf = enderecoRequest.Uf,
                Cep = enderecoRequest.Cep,
                Default = enderecoRequest.Default || enderecos.Count == 0
            };

            var enderecoId = await _fornecedorEnderecoRepository.Cadastrar(endereco);

            if (endereco.Default)
                await _fornecedorEnderecoRepository.DefinirDefault(fornecedorId, enderecoId);

            return enderecoId;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar endereço do fornecedor: {ex.Message}");
        }
    }

    public async Task Validar(Guid fornecedorId, FornecedorEnderecoValidacaoRequest enderecoRequest)
    {
        try
        {
            await ValidarEndereco(fornecedorId, enderecoRequest);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao validar endereço do fornecedor: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid fornecedorId, Guid fornecedorEnderecoId, FornecedorEnderecoPutRequest enderecoRequest)
    {
        await ValidarEndereco(fornecedorId, enderecoRequest);

        var endereco = new FornecedorEndereco
        {
            FornecedorEnderecoId = fornecedorEnderecoId,
            FornecedorId = fornecedorId,
            Logradouro = enderecoRequest.Logradouro,
            Numero = enderecoRequest.Numero,
            Complemento = enderecoRequest.Complemento,
            Bairro = enderecoRequest.Bairro,
            Cidade = enderecoRequest.Cidade,
            Uf = enderecoRequest.Uf,
            Cep = enderecoRequest.Cep
        };

        var affected = await _fornecedorEnderecoRepository.Atualizar(endereco);

        if (affected <= 0) throw new NotFoundException("Endereço não encontrado para o fornecedor informado.");

        await DefinirEnderecoUnicoComoDefault(fornecedorId);
    }

    public async Task Excluir(Guid fornecedorId, Guid fornecedorEnderecoId)
    {
        await ValidarFornecedorExiste(fornecedorId);
        var enderecos = await _fornecedorEnderecoRepository.Obter(fornecedorId);
        var endereco = enderecos.FirstOrDefault(x => x.FornecedorEnderecoId == fornecedorEnderecoId);

        if (endereco == null) throw new NotFoundException("Endereço não encontrado para o fornecedor informado.");

        var affected = await _fornecedorEnderecoRepository.Excluir(fornecedorId, fornecedorEnderecoId);

        if (affected <= 0) throw new NotFoundException("Endereço não encontrado para o fornecedor informado.");

        await DefinirEnderecoUnicoComoDefault(fornecedorId);
    }

    public async Task DefinirDefault(Guid fornecedorId, Guid fornecedorEnderecoId)
    {
        await ValidarFornecedorExiste(fornecedorId);

        var affected = await _fornecedorEnderecoRepository.DefinirDefault(fornecedorId, fornecedorEnderecoId);

        if (affected <= 0) throw new NotFoundException("Endereço não encontrado para o fornecedor informado.");
    }

    private async Task DefinirEnderecoUnicoComoDefault(Guid fornecedorId)
    {
        var enderecos = await _fornecedorEnderecoRepository.Obter(fornecedorId);

        if (enderecos.Count > 0 && !enderecos.Any(endereco => endereco.Default))
            await _fornecedorEnderecoRepository.DefinirDefault(fornecedorId, enderecos[0].FornecedorEnderecoId);
    }

    private async Task ValidarEndereco(Guid fornecedorId, FornecedorEnderecoPostRequest endereco)
    {
        await ValidarEnderecoBase(fornecedorId, endereco.Logradouro, endereco.Numero, endereco.Cidade, endereco.Uf);
    }

    private async Task ValidarEndereco(Guid fornecedorId, FornecedorEnderecoPutRequest endereco)
    {
        await ValidarEnderecoBase(fornecedorId, endereco.Logradouro, endereco.Numero, endereco.Cidade, endereco.Uf);
    }

    private async Task ValidarEnderecoBase(Guid fornecedorId, string logradouro, string numero, string cidade, string uf)
    {
        await ValidarFornecedorExiste(fornecedorId);

        if (string.IsNullOrWhiteSpace(logradouro))
            AddError(nameof(FornecedorEndereco.Logradouro), "Informe o endereço.");

        if (string.IsNullOrWhiteSpace(numero))
            AddError(nameof(FornecedorEndereco.Numero), "Informe o número.");

        if (string.IsNullOrWhiteSpace(cidade))
            AddError(nameof(FornecedorEndereco.Cidade), "Informe a cidade.");

        if (string.IsNullOrWhiteSpace(uf))
            AddError(nameof(FornecedorEndereco.Uf), "Informe a UF.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarFornecedorExiste(Guid fornecedorId)
    {
        if (fornecedorId == Guid.Empty)
            throw new NotFoundException("Fornecedor não encontrado com o ID informado.");

        var fornecedorExiste = await _fornecedorRepository.VerificarFornecedorExiste(fornecedorId);

        if (!fornecedorExiste)
            throw new NotFoundException("Fornecedor não encontrado com o ID informado.");
    }
}