using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ReferenciaProdutoService : BaseService
{
    private readonly IReferenciaProdutoRepository _referenciaProdutoRepository;
    private readonly ILinhaProdutoRepository _linhaProdutoRepository;
    private readonly ICorRepository _corRepository;

    public ReferenciaProdutoService(
        IReferenciaProdutoRepository referenciaProdutoRepository,
        ILinhaProdutoRepository linhaProdutoRepository,
        ICorRepository corRepository)
    {
        _referenciaProdutoRepository = referenciaProdutoRepository;
        _linhaProdutoRepository = linhaProdutoRepository;
        _corRepository = corRepository;
    }

    public async Task<ReferenciaProdutoPostResponse> Cadastrar(ReferenciaProdutoPostRequest request)
    {
        try
        {
            await ValidarLinha(request.LinhaProdutoId, false);
            await ValidarCor(request.CorId, false);
            ValidarSigla(request.Sigla);

            if (Errors.Any())
                throw new ValidationException(Errors);

            var proximaReferencia = await _referenciaProdutoRepository.ObterProxima(request.LinhaProdutoId);

            if (proximaReferencia == null)
                throw new NotFoundException("Linha de produto não encontrada com o ID informado.");

            var referenciaExiste = await _referenciaProdutoRepository.VerificarReferenciaExiste(request.LinhaProdutoId, proximaReferencia.ProximaReferencia);

            if (referenciaExiste)
                AddError(nameof(ReferenciaProduto.NumeroReferencia), "Referência já existente para esta linha.");

            if (Errors.Any())
                throw new ValidationException(Errors);

            var cor = await _corRepository.Obter(request.CorId!.Value);
            var sigla = request.Sigla.Trim().ToUpperInvariant();
            var referencia = $"{proximaReferencia.Referencia}{sigla}-{cor!.CorCodigo}";

            var referenciaProduto = new ReferenciaProduto
            {
                ReferenciaProdutoId = Guid.NewGuid(),
                LinhaProdutoId = request.LinhaProdutoId,
                CorId = request.CorId,
                NumeroReferencia = proximaReferencia.ProximaReferencia,
                Referencia = referencia,
                Sigla = sigla,
                Observacao = request.Observacao?.Trim()
            };

            var referenciaProdutoId = await _referenciaProdutoRepository.Cadastrar(referenciaProduto);

            return new ReferenciaProdutoPostResponse
            {
                ReferenciaProdutoId = referenciaProdutoId,
                LinhaProdutoId = request.LinhaProdutoId,
                CorId = request.CorId,
                Linha = proximaReferencia.Linha,
                NumeroReferencia = proximaReferencia.ProximaReferencia,
                Referencia = referencia,
                Sigla = sigla,
                CorDescricao = cor.CorDescricao,
                CorCodigo = cor.CorCodigo,
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

    private async Task ValidarLinha(Guid linhaProdutoId, bool lancarErro = true)
    {
        if (linhaProdutoId == Guid.Empty)
            AddError(nameof(ReferenciaProduto.LinhaProdutoId), "Informe a linha.");

        if (linhaProdutoId != Guid.Empty)
        {
            var linhaExiste = await _linhaProdutoRepository.VerificarLinhaProdutoExiste(linhaProdutoId);

            if (!linhaExiste)
                AddError(nameof(ReferenciaProduto.LinhaProdutoId), "Linha de produto não encontrada com o ID informado.");
        }

        if (lancarErro && Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarCor(Guid? corId, bool lancarErro = true)
    {
        if (!corId.HasValue)
            AddError(nameof(ReferenciaProduto.CorId), "Informe a cor.");

        if (corId.HasValue && corId.Value == Guid.Empty)
            AddError(nameof(ReferenciaProduto.CorId), "Informe uma cor válida.");

        if (corId.HasValue && corId.Value != Guid.Empty)
        {
            var corExiste = await _corRepository.VerificarCorExiste(corId.Value);

            if (!corExiste)
                AddError(nameof(ReferenciaProduto.CorId), "Cor não encontrada com o ID informado.");
        }

        if (lancarErro && Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarSigla(string sigla)
    {
        if (string.IsNullOrWhiteSpace(sigla))
            AddError(nameof(ReferenciaProduto.Sigla), "Informe a sigla.");
    }
}
