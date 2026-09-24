using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ReferenciaDesenhoService : BaseService
{
    private const long MaxUploadSizeBytes = 100 * 1024 * 1024;

    private readonly IReferenciaRepository _referenciaRepository;
    private readonly IReferenciaDesenhoRepository _referenciaDesenhoRepository;
    private readonly IDesenhoFileStorageService _desenhoFileStorageService;

    public ReferenciaDesenhoService(
        IReferenciaRepository referenciaRepository,
        IReferenciaDesenhoRepository referenciaDesenhoRepository,
        IDesenhoFileStorageService desenhoFileStorageService)
    {
        _referenciaRepository = referenciaRepository;
        _referenciaDesenhoRepository = referenciaDesenhoRepository;
        _desenhoFileStorageService = desenhoFileStorageService;
    }

    public Task<ReferenciaDesenhoResponse> CadastrarDesenhoOriginal(Guid referenciaId, ReferenciaDesenhoUploadRequest request)
    {
        return Cadastrar(referenciaId, request);
    }

    private async Task<ReferenciaDesenhoResponse> Cadastrar(Guid referenciaId, ReferenciaDesenhoUploadRequest request)
    {
        try
        {
            await ValidarReferencia(referenciaId);

            var arquivo = ObterArquivoBytes(request);
            ValidarArquivo(request, arquivo);

            var contentType = string.IsNullOrWhiteSpace(request.ContentType) ? "application/octet-stream" : request.ContentType.Trim();
            var desenhoAtual = await _referenciaDesenhoRepository.ObterDesenhoOriginal(referenciaId);

            if (desenhoAtual != null)
            {
                await _desenhoFileStorageService.EnviarArquivo(desenhoAtual.ReferenciaDesenhoLinkId, arquivo, contentType);

                desenhoAtual.UrlVisualizacao = _desenhoFileStorageService.GerarUrlVisualizacao(desenhoAtual.ReferenciaDesenhoLinkId);

                return desenhoAtual;
            }

            var referenciaDesenhoId = Guid.NewGuid();
            var linkId = MontarArquivoKey(referenciaId, referenciaDesenhoId, request.NomeArquivo);

            await _desenhoFileStorageService.EnviarArquivo(linkId, arquivo, contentType);

            var desenho = new ReferenciaDesenho
            {
                ReferenciaDesenhoId = referenciaDesenhoId,
                ReferenciaId = referenciaId,
                ReferenciaDesenhoLinkId = linkId,
                DesenhoOriginal = true
            };

            var result = await _referenciaDesenhoRepository.Cadastrar(desenho);
            result.UrlVisualizacao = _desenhoFileStorageService.GerarUrlVisualizacao(result.ReferenciaDesenhoLinkId);

            return result;
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
            throw new Exception($"Erro ao salvar desenho da referência: {ex.Message}");
        }
    }

    public async Task<List<ReferenciaDesenhoResponse>> ObterPorReferencia(Guid referenciaId)
    {
        try
        {
            await ValidarReferencia(referenciaId);

            var desenhos = await _referenciaDesenhoRepository.ObterPorReferencia(referenciaId);

            foreach (var desenho in desenhos)
            {
                desenho.UrlVisualizacao = _desenhoFileStorageService.GerarUrlVisualizacao(desenho.ReferenciaDesenhoLinkId);
            }

            return desenhos;
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
            throw new Exception($"Erro ao obter desenhos da referência: {ex.Message}");
        }
    }

    public async Task<ReferenciaDesenhoResponse> ObterDesenhoOriginalBase64(Guid referenciaId)
    {
        try
        {
            await ValidarReferencia(referenciaId);

            var desenho = await _referenciaDesenhoRepository.ObterDesenhoOriginal(referenciaId);

            if (desenho == null)
                throw new NotFoundException("Desenho original não encontrado para a referência informada.");

            var arquivo = await _desenhoFileStorageService.ObterArquivoBase64(desenho.ReferenciaDesenhoLinkId);

            desenho.ArquivoBase64 = arquivo.ArquivoBase64;
            desenho.ContentType = arquivo.ContentType;

            return desenho;
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
            throw new Exception($"Erro ao obter desenho original da referência: {ex.Message}");
        }
    }

    private async Task ValidarReferencia(Guid referenciaId)
    {
        if (referenciaId == Guid.Empty)
            AddError(nameof(ReferenciaDesenho.ReferenciaId), "Informe a referência.");

        if (referenciaId != Guid.Empty)
        {
            var referenciaExiste = await _referenciaRepository.VerificarReferenciaExiste(referenciaId);

            if (!referenciaExiste)
                AddError(nameof(ReferenciaDesenho.ReferenciaId), "Referência não encontrada com o ID informado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private byte[] ObterArquivoBytes(ReferenciaDesenhoUploadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ArquivoBase64))
            return [];

        try
        {
            return Convert.FromBase64String(ObterBase64Limpo(request.ArquivoBase64));
        }
        catch (FormatException)
        {
            AddError(nameof(request.ArquivoBase64), "O arquivo informado não está em base64 válido.");
            throw new ValidationException(Errors);
        }
    }

    private void ValidarArquivo(ReferenciaDesenhoUploadRequest request, byte[] arquivo)
    {
        if (arquivo.Length <= 0)
            AddError(nameof(request.ArquivoBase64), "Informe o arquivo do desenho.");

        if (string.IsNullOrWhiteSpace(request.NomeArquivo))
            AddError(nameof(request.NomeArquivo), "Informe o nome do arquivo.");

        if (arquivo.Length > MaxUploadSizeBytes)
            AddError(nameof(request.ArquivoBase64), "O arquivo deve ter no máximo 100 MB.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private static string ObterBase64Limpo(string arquivoBase64)
    {
        if (string.IsNullOrWhiteSpace(arquivoBase64))
            return string.Empty;

        var base64 = arquivoBase64.Trim();
        var base64Index = base64.IndexOf("base64,", StringComparison.OrdinalIgnoreCase);

        return base64Index >= 0 ? base64[(base64Index + "base64,".Length)..] : base64;
    }

    private static string MontarArquivoKey(Guid referenciaId, Guid referenciaDesenhoId, string nomeArquivo)
    {
        var extensao = Path.GetExtension(nomeArquivo).ToLowerInvariant();

        return $"{referenciaDesenhoId:N}{extensao}";
    }
}