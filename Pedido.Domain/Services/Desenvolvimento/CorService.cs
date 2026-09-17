using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class CorService : BaseService
{
    private readonly ICorRepository _corRepository;

    public CorService(ICorRepository corRepository)
    {
        _corRepository = corRepository;
    }

    public async Task<CorPostResponse> Cadastrar(CorPostRequest request)
    {
        try
        {
            ValidarCampos(request);

            var cor = new Cor
            {
                CorId = Guid.NewGuid(),
                CorDescricao = request.CorDescricao.Trim(),
                CorCodigo = request.CorCodigo.Trim()
            };

            var corId = await _corRepository.Cadastrar(cor);

            return new CorPostResponse
            {
                CorId = corId,
                CorDescricao = cor.CorDescricao,
                CorCodigo = cor.CorCodigo
            };
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar cor: {ex.Message}");
        }
    }

    public async Task<List<CorGetResponse>> Obter(CorGetRequest request)
    {
        try
        {
            return await _corRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter cores: {ex.Message}");
        }
    }

    public async Task<bool> CorExiste(Guid corId)
    {
        return await _corRepository.VerificarCorExiste(corId);
    }

    private void ValidarCampos(CorPostRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CorDescricao))
            AddError(nameof(Cor.CorDescricao), "Informe a cor.");

        if (string.IsNullOrWhiteSpace(request.CorCodigo))
            AddError(nameof(Cor.CorCodigo), "Informe o código.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}