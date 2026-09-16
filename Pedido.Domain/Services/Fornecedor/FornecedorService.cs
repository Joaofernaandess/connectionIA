using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class FornecedorService : BaseService
{
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IFornecedorEnderecoRepository _fornecedorEnderecoRepository;
    private readonly IFornecedorContatoRepository _fornecedorContatoRepository;

    public FornecedorService(
        IFornecedorRepository fornecedorRepository,
        IFornecedorEnderecoRepository fornecedorEnderecoRepository,
        IFornecedorContatoRepository fornecedorContatoRepository)
    {
        _fornecedorRepository = fornecedorRepository;
        _fornecedorEnderecoRepository = fornecedorEnderecoRepository;
        _fornecedorContatoRepository = fornecedorContatoRepository;
    }

    public async Task<Guid> Cadastrar(FornecedorPostRequest fornecedorRequest)
    {
        try
        {
            fornecedorRequest.Cnpj = StringHelper.ObterApenasNumeros(fornecedorRequest.Cnpj);
            fornecedorRequest.InscricaoEstadual = StringHelper.ObterApenasNumeros(fornecedorRequest.InscricaoEstadual);

            await ValidarCampos(fornecedorRequest, Guid.Empty);

            var fornecedor = new Fornecedor
            {
                FornecedorId = Guid.NewGuid(),
                RazaoSocial = fornecedorRequest.RazaoSocial,
                Fantasia = fornecedorRequest.Fantasia,
                Cnpj = fornecedorRequest.Cnpj,
                InscricaoEstadual = fornecedorRequest.InscricaoEstadual
            };

            return await _fornecedorRepository.Cadastrar(fornecedor);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar fornecedor: {ex.Message}");
        }
    }

    public async Task<List<FornecedorGetResponse>> Obter(FornecedorGetRequest request)
    {
        try
        {
            return await _fornecedorRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter fornecedores: {ex.Message}");
        }
    }

    public async Task<Fornecedor> Obter(Guid fornecedorId)
    {
        try
        {
            var fornecedor = await _fornecedorRepository.Obter(fornecedorId);

            if (fornecedor == null) throw new NotFoundException("Fornecedor não encontrado com o ID informado.");

            fornecedor.Enderecos = await _fornecedorEnderecoRepository.Obter(fornecedor.FornecedorId);
            fornecedor.Contatos = await _fornecedorContatoRepository.Obter(fornecedor.FornecedorId);

            return fornecedor;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter fornecedor por ID: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid fornecedorId, FornecedorPutRequest fornecedorRequest)
    {
        try
        {
            fornecedorRequest.Cnpj = StringHelper.ObterApenasNumeros(fornecedorRequest.Cnpj);
            fornecedorRequest.InscricaoEstadual = StringHelper.ObterApenasNumeros(fornecedorRequest.InscricaoEstadual);

            await ValidarCampos(fornecedorRequest, fornecedorId);

            var fornecedor = new Fornecedor
            {
                FornecedorId = fornecedorId,
                RazaoSocial = fornecedorRequest.RazaoSocial,
                Fantasia = fornecedorRequest.Fantasia,
                Cnpj = fornecedorRequest.Cnpj,
                InscricaoEstadual = fornecedorRequest.InscricaoEstadual
            };

            var affected = await _fornecedorRepository.Atualizar(fornecedor);

            if (affected <= 0) throw new NotFoundException("Fornecedor não encontrado com o ID informado.");
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
            throw new Exception($"Erro ao atualizar fornecedor: {ex.Message}");
        }
    }

    public async Task<bool> FornecedorExiste(Guid fornecedorId)
    {
        return await _fornecedorRepository.VerificarFornecedorExiste(fornecedorId);
    }

    private async Task ValidarCampos(FornecedorPostRequest fornecedor, Guid fornecedorId)
    {
        await ValidarCamposBase(fornecedor.RazaoSocial, fornecedor.Cnpj, fornecedorId);
    }

    private async Task ValidarCampos(FornecedorPutRequest fornecedor, Guid fornecedorId)
    {
        await ValidarCamposBase(fornecedor.RazaoSocial, fornecedor.Cnpj, fornecedorId);
    }

    private async Task ValidarCamposBase(string razaoSocial, string cnpj, Guid fornecedorId)
    {
        if (string.IsNullOrWhiteSpace(razaoSocial))
            AddError(nameof(Fornecedor.RazaoSocial), "Informe a razão social.");

        if (string.IsNullOrWhiteSpace(cnpj))
        {
            AddError(nameof(Fornecedor.Cnpj), "Informe o CNPJ.");
        }
        else
        {
            var cnpjExiste = await _fornecedorRepository.VerificarFornecedorExiste(cnpj, fornecedorId);

            if (cnpjExiste)
                AddError(nameof(Fornecedor.Cnpj), "Este CNPJ já está sendo utilizado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}