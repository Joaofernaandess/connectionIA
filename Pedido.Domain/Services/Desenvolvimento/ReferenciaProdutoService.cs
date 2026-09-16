using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ReferenciaProdutoService : BaseService
{
    private readonly IReferenciaProdutoRepository _referenciaProdutoRepository;
    private readonly ILinhaProdutoRepository _linhaProdutoRepository;

    public ReferenciaProdutoService(
        IReferenciaProdutoRepository referenciaProdutoRepository,
        ILinhaProdutoRepository linhaProdutoRepository)
    {
        _referenciaProdutoRepository = referenciaProdutoRepository;
        _linhaProdutoRepository = linhaProdutoRepository;
    }

    public async Task<ReferenciaProdutoPostResponse> Cadastrar(ReferenciaProdutoPostRequest request)
    {
        try
        {
            await ValidarLinha(request.LinhaProdutoId);

            var proximaReferencia = await _referenciaProdutoRepository.ObterProxima(request.LinhaProdutoId);

            if (proximaReferencia == null)
                throw new NotFoundException("Linha de produto não encontrada com o ID informado.");

            var referenciaExiste = await _referenciaProdutoRepository.VerificarReferenciaExiste(request.LinhaProdutoId, proximaReferencia.ProximaReferencia);

            if (referenciaExiste)
                AddError(nameof(ReferenciaProduto.NumeroReferencia), "Referência já existente para esta linha.");

            if (Errors.Any())
                throw new ValidationException(Errors);

            var referenciaProduto = new ReferenciaProduto
            {
                ReferenciaProdutoId = Guid.NewGuid(),
                LinhaProdutoId = request.LinhaProdutoId,
                NumeroReferencia = proximaReferencia.ProximaReferencia,
                Referencia = proximaReferencia.Referencia,
                Observacao = request.Observacao?.Trim()
            };

            var referenciaProdutoId = await _referenciaProdutoRepository.Cadastrar(referenciaProduto);

            return new ReferenciaProdutoPostResponse
            {
                ReferenciaProdutoId = referenciaProdutoId,
                LinhaProdutoId = request.LinhaProdutoId,
                Linha = proximaReferencia.Linha,
                NumeroReferencia = proximaReferencia.ProximaReferencia,
                Referencia = proximaReferencia.Referencia,
                Observacao = referenciaProduto.Observacao
            };
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
            throw new Exception($"Erro ao cadastrar referência de produto: {ex.Message}");
        }
    }

    public async Task<List<ReferenciaProdutoGetResponse>> Obter(ReferenciaProdutoGetRequest request)
    {
        try
        {
            return await _referenciaProdutoRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter referências de produto: {ex.Message}");
        }
    }

    public async Task<ReferenciaProdutoProximaResponse> ObterProxima(Guid linhaProdutoId)
    {
        try
        {
            await ValidarLinha(linhaProdutoId);

            var proximaReferencia = await _referenciaProdutoRepository.ObterProxima(linhaProdutoId);

            if (proximaReferencia == null)
                throw new NotFoundException("Linha de produto não encontrada com o ID informado.");

            return proximaReferencia;
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
            throw new Exception($"Erro ao obter próxima referência de produto: {ex.Message}");
        }
    }

    private async Task ValidarLinha(Guid linhaProdutoId)
    {
        if (linhaProdutoId == Guid.Empty)
            AddError(nameof(ReferenciaProduto.LinhaProdutoId), "Informe a linha.");

        if (linhaProdutoId != Guid.Empty)
        {
            var linhaExiste = await _linhaProdutoRepository.VerificarLinhaProdutoExiste(linhaProdutoId);

            if (!linhaExiste)
                AddError(nameof(ReferenciaProduto.LinhaProdutoId), "Linha de produto não encontrada com o ID informado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}
