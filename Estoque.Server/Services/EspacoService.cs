using Estoque.Server.Exceptions;
using Estoque.Server.Models;
using Estoque.Server.Repositories;

namespace Estoque.Server.Services;

public class EspacoService : BaseService
{
    private readonly EspacoRepository _repository;

    public EspacoService(EspacoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Cadastrar(Espaco espaco)
    {
        try
        {
            await ValidarCampos(espaco, Guid.Empty);

            return await _repository.Cadastrar(espaco);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar espaço: {ex.Message}");
        }
    }

    public async Task Atualizar(Espaco espaco, Guid espacoId)
    {
        try
        {
            await ValidarCampos(espaco, espacoId);

            var affected = await _repository.Atualizar(espaco, espacoId);

            if (affected <= 0) throw new NotFoundException("Espaço não encontrado com o ID informado.");
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
            throw new Exception($"Erro ao atualizar espaço: {ex.Message}");
        }
    }

    public async Task Excluir(Guid espacoId)
    {
        try
        {
            bool possuiItens = await _repository.PossuiItensVinculados(espacoId);

            if (possuiItens)
            {
                AddError("EspacoId", "Este espaço não pode ser excluído porque existem itens de estoque vinculados à ele.");
                throw new ValidationException(Errors);
            }

            var affected = await _repository.Excluir(espacoId);

            if (affected <= 0) throw new NotFoundException("Espaço não encontrado com o ID informado.");
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
            throw new Exception($"Erro ao excluir espaço: {ex.Message}");
        }
    }

    public async Task<List<EspacoGetResponse>> Obter(int skip, int top, string? nome, Guid? unidadeOrganizacionalId)
    {
        try
        {
            return await _repository.Obter(skip, top, nome, unidadeOrganizacionalId);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter espaços: {ex.Message}");
        }
    }

    public async Task<EspacoGetResponse> Obter(Guid espacoId)
    {
        try
        {
            var espaco = await _repository.Obter(espacoId);

            if (espaco == null) throw new NotFoundException("Espaço não encontrado com o ID informado.");

            return espaco;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter espaço por ID: {ex.Message}");
        }
    }

    private async Task ValidarCampos(Espaco espaco, Guid espacoId)
    {
        espaco.Nome = espaco.Nome?.Trim() ?? string.Empty;

        if (espaco.UnidadeOrganizacionalId == null || espaco.UnidadeOrganizacionalId == Guid.Empty)
            AddError(nameof(espaco.UnidadeOrganizacionalId), "Informe a unidade organizacional.");

        if (string.IsNullOrWhiteSpace(espaco.Nome))
        {
            AddError(nameof(espaco.Nome), "Informe o nome.");
        }
        else
        {
            bool existe = await _repository.ValidarDuplicidade(espaco.Nome, espaco.UnidadeOrganizacionalId!.Value, espacoId);

            if (existe)
                AddError(nameof(espaco.Nome), "Espaço já cadastrado com o nome informado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}