using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ReferenciaPrototipoService : BaseService
{
    private const long MaxUploadSizeBytes = 100 * 1024 * 1024;

    private readonly IReferenciaRepository _referenciaRepository;
    private readonly IReferenciaDesenhoRepository _referenciaDesenhoRepository;
    private readonly IReferenciaPrototipoRepository _prototipoRepository;
    private readonly IReferenciaPrototipoFileStorageService _prototipoFileStorageService;

    public ReferenciaPrototipoService(
        IReferenciaRepository referenciaRepository,
        IReferenciaDesenhoRepository referenciaDesenhoRepository,
        IReferenciaPrototipoRepository referenciaPrototipoRepository,
        IReferenciaPrototipoFileStorageService referenciaPrototipoFileStorageService)
    {
        _referenciaRepository = referenciaRepository;
        _referenciaDesenhoRepository = referenciaDesenhoRepository;
        _prototipoRepository = referenciaPrototipoRepository;
        _prototipoFileStorageService = referenciaPrototipoFileStorageService;
    }

    public async Task<ReferenciaDesenhoResponse> Cadastrar(Guid referenciaId, Guid corId, ReferenciaDesenhoUploadRequest request)
    {
        try
        {
            await ValidarReferenciaCor(referenciaId, corId);

            var prototipoAtual = await _prototipoRepository.ObterPorReferenciaCor(referenciaId, corId);

            if (prototipoAtual != null)
                return await AtualizarArquivo(prototipoAtual, request);

            var arquivo = ObterArquivoBytes(request);
            ValidarArquivo(request, arquivo);

            var contentType = string.IsNullOrWhiteSpace(request.ContentType) ? "application/octet-stream" : request.ContentType.Trim();
            var referenciaDesenhoId = Guid.NewGuid();
            var linkId = MontarArquivoKey(referenciaDesenhoId, request.NomeArquivo);

            await _prototipoFileStorageService.EnviarArquivo(linkId, arquivo, contentType);

            var desenho = await _referenciaDesenhoRepository.Cadastrar(new ReferenciaDesenho
            {
                ReferenciaDesenhoId = referenciaDesenhoId,
                ReferenciaId = referenciaId,
                ReferenciaDesenhoLinkId = linkId,
                DesenhoOriginal = false
            });

            await _prototipoRepository.Cadastrar(new ReferenciaPrototipo
            {
                ReferenciaPrototipoId = Guid.NewGuid(),
                ReferenciaId = referenciaId,
                ReferenciaDesenhoId = desenho.ReferenciaDesenhoId,
                CorId = corId
            });

            desenho.UrlVisualizacao = _prototipoFileStorageService.GerarUrlVisualizacao(desenho.ReferenciaDesenhoLinkId);

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
            throw new Exception($"Erro ao salvar protótipo da referência: {ex.Message}");
        }
    }

    public async Task<ReferenciaDesenhoResponse> ObterBase64(Guid referenciaId, Guid corId)
    {
        try
        {
            await ValidarReferenciaCor(referenciaId, corId);

            var referenciaPrototipo = await _prototipoRepository.ObterPorReferenciaCor(referenciaId, corId);

            if (referenciaPrototipo == null)
                throw new NotFoundException("Protótipo não encontrado para a referência e cor informadas.");

            var desenho = await _referenciaDesenhoRepository.Obter(referenciaPrototipo.ReferenciaDesenhoId);

            if (desenho == null)
                throw new NotFoundException("Desenho do protótipo não encontrado.");

            var arquivo = await _prototipoFileStorageService.ObterArquivoBase64(desenho.ReferenciaDesenhoLinkId);

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
            throw new Exception($"Erro ao obter protótipo da referência: {ex.Message}");
        }
    }

    private async Task<ReferenciaDesenhoResponse> AtualizarArquivo(ReferenciaPrototipoResponse referenciaPrototipo, ReferenciaDesenhoUploadRequest request)
    {
        var desenhoAtual = await _referenciaDesenhoRepository.Obter(referenciaPrototipo.ReferenciaDesenhoId);

        if (desenhoAtual == null)
            throw new NotFoundException("Desenho do protótipo não encontrado.");

        var arquivo = ObterArquivoBytes(request);
        ValidarArquivo(request, arquivo);

        var contentType = string.IsNullOrWhiteSpace(request.ContentType) ? "application/octet-stream" : request.ContentType.Trim();

        await _prototipoFileStorageService.EnviarArquivo(desenhoAtual.ReferenciaDesenhoLinkId, arquivo, contentType);

        desenhoAtual.UrlVisualizacao = _prototipoFileStorageService.GerarUrlVisualizacao(desenhoAtual.ReferenciaDesenhoLinkId);

        return desenhoAtual;
    }

    private async Task ValidarReferenciaCor(Guid referenciaId, Guid corId)
    {
        if (referenciaId == Guid.Empty)
            AddError(nameof(ReferenciaDesenho.ReferenciaId), "Informe a referência.");

        if (corId == Guid.Empty)
            AddError(nameof(ReferenciaCor.CorId), "Informe a cor.");

        if (referenciaId != Guid.Empty)
        {
            var referenciaExiste = await _referenciaRepository.VerificarReferenciaExiste(referenciaId);

            if (!referenciaExiste)
                AddError(nameof(ReferenciaDesenho.ReferenciaId), "Referência não encontrada com o ID informado.");
        }

        if (referenciaId != Guid.Empty && corId != Guid.Empty)
        {
            var referenciaCorExiste = await _referenciaRepository.VerificarReferenciaCorExiste(referenciaId, corId);

            if (!referenciaCorExiste)
                AddError(nameof(ReferenciaCor.CorId), "Cor não encontrada para a referência informada.");
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
            AddError(nameof(request.ArquivoBase64), "Informe o arquivo do protótipo.");

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

    private static string MontarArquivoKey(Guid referenciaDesenhoId, string nomeArquivo)
    {
        var extensao = Path.GetExtension(nomeArquivo).ToLowerInvariant();

        return $"{referenciaDesenhoId:N}{extensao}";
    }
}
