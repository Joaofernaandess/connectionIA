using Estoque.Server.Exceptions;
using Estoque.Server.Models;
using Estoque.Server.Repositories;
using Estoque.Server.Validations;

namespace Estoque.Server.Services;

public class UnidadeOrganizacionalService : BaseService
{
    private readonly UnidadeOrganizacionalRepository _repository;

    public UnidadeOrganizacionalService(UnidadeOrganizacionalRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Cadastrar(UnidadeOrganizacional unidadeOrganizacional)
    {
        try
        {
            await ValidarCampos(unidadeOrganizacional, Guid.Empty);

            return await _repository.Cadastrar(unidadeOrganizacional);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar unidade organizacional: {ex.Message}");
        }
    }

    public async Task Atualizar(UnidadeOrganizacional unidadeOrganizacional, Guid unidadeOrganizacionalId)
    {
        try
        {
            await ValidarCampos(unidadeOrganizacional, unidadeOrganizacionalId);

            var affected = await _repository.Atualizar(unidadeOrganizacional, unidadeOrganizacionalId);

            if (affected <= 0) throw new NotFoundException("Unidade organizacional não encontrada com o ID informado.");
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao atualizar unidade organizacional: {ex.Message}");
        }
    }

    public async Task Excluir(Guid unidadeOrganizacionalId)
    {
        try
        {
            var affected = await _repository.Excluir(unidadeOrganizacionalId);

            if (affected <= 0) throw new NotFoundException("Unidade organizacional não encontrada com o ID informado.");
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao excluir unidade organizacional: {ex.Message}");
        }
    }

    public async Task<List<UnidadeOrganizacionalGetResponse>> Obter(int skip, int top, string? razaoSocial, string? cnpj)
    {
        try
        {
            return await _repository.Obter(skip, top, razaoSocial, cnpj);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter unidades organizacionais: {ex.Message}");
        }
    }

    public async Task<UnidadeOrganizacionalGetResponse> Obter(Guid unidadeOrganizacionalId)
    {
        try
        {
            var unidadeOrganizacional = await _repository.Obter(unidadeOrganizacionalId);

            if (unidadeOrganizacional == null) throw new NotFoundException("Unidade organizacional não encontrada com o ID informado.");

            return unidadeOrganizacional;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter unidade organizacional por ID: {ex.Message}");
        }
    }

    private async Task ValidarCampos(UnidadeOrganizacional unidadeOrganizacional, Guid unidadeOrganizacionalId)
    {

        if (string.IsNullOrWhiteSpace(unidadeOrganizacional.RazaoSocial))
            AddError(nameof(unidadeOrganizacional.RazaoSocial), "Informe a razão social.");

        if (string.IsNullOrWhiteSpace(unidadeOrganizacional.Cnpj))
        {
            AddError(nameof(unidadeOrganizacional.Cnpj), "Informe o CNPJ.");
        }
        else if (!RuleValidation.CnpjValido(unidadeOrganizacional.Cnpj))
        {
            AddError(nameof(unidadeOrganizacional.Cnpj), "CNPJ inválido.");
        }
        else
        {
            bool existe = await _repository.ValidarDuplicidade(unidadeOrganizacional.Cnpj, unidadeOrganizacionalId);

            if (existe)
                AddError(nameof(unidadeOrganizacional.Cnpj), "Unidade organizacional já cadastrada para o CNPJ informado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}