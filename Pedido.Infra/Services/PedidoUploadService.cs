using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Services;
using PedidoModel = Pedido.Domain.Models.Pedido;

namespace Pedido.Infra.Services;

public class PedidoUploadService : BaseService, IPedidoUploadService
{
    private const long MaxUploadSizeBytes = 100 * 1024 * 1024;

    private readonly IPedidoRepository _pedidoRepository;
    private readonly IPedidoFileStorageService _fileStorageService;
    private readonly IPedidoSeparadorService _pedidoSeparadorService;
    private readonly IPedidoAtualizacaoNotifier _pedidoAtualizacaoNotifier;

    public PedidoUploadService(
        IPedidoRepository pedidoRepository,
        IPedidoFileStorageService fileStorageService,
        IPedidoSeparadorService pedidoSeparadorService,
        IPedidoAtualizacaoNotifier pedidoAtualizacaoNotifier)
    {
        _pedidoRepository = pedidoRepository;
        _fileStorageService = fileStorageService;
        _pedidoSeparadorService = pedidoSeparadorService;
        _pedidoAtualizacaoNotifier = pedidoAtualizacaoNotifier;
    }

    public async Task<PedidoUploadResponse> Upload(PedidoUploadRequest request, Guid usuarioId)
    {
        try
        {
            var arquivo = ObterArquivoBytes(request);
            ValidarArquivo(request, arquivo);

            var arquivos = await _pedidoSeparadorService.Separar(request, arquivo);
            var pedidos = new List<PedidoUploadItemResponse>();

            foreach (var arquivoPedido in arquivos)
            {
                var pedidoId = Guid.NewGuid();
                var pedidoLinkId = MontarPedidoLinkId(pedidoId, arquivoPedido.NomeArquivo);

                var pedido = new PedidoModel
                {
                    PedidoId = pedidoId,
                    PedidoLinkId = pedidoLinkId,
                    UsuarioId = usuarioId,
                    Status = PedidoStatus.AguardandoAnaliseIA
                };

                await _pedidoRepository.CadastrarPedido(pedido);
                await _pedidoAtualizacaoNotifier.NotificarPedidoAtualizado(pedidoId, pedido.Status);
                await _fileStorageService.EnviarArquivo(pedidoLinkId, arquivoPedido.Arquivo, arquivoPedido.ContentType);

                pedidos.Add(new PedidoUploadItemResponse
                {
                    PedidoId = pedidoId,
                    PedidoLinkId = pedidoLinkId,
                    NomeArquivo = arquivoPedido.NomeArquivo,
                    PaginaInicial = arquivoPedido.PaginaInicial,
                    PaginaFinal = arquivoPedido.PaginaFinal,
                    Status = PedidoStatus.AguardandoAnaliseIA.ToString()
                });
            }

            var primeiroPedido = pedidos.First();

            return new PedidoUploadResponse
            {
                PedidoId = primeiroPedido.PedidoId,
                PedidoLinkId = primeiroPedido.PedidoLinkId,
                Status = PedidoStatus.AguardandoAnaliseIA.ToString(),
                Mensagem = pedidos.Count == 1
                    ? "Pedido enviado para análise da Inteligência Artificial"
                    : $"{pedidos.Count} pedidos enviados para análise da Inteligência Artificial",
                ArquivoSeparado = pedidos.Count > 1,
                Pedidos = pedidos
            };
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao enviar arquivo do pedido: {ex.Message}");
        }
    }

    private byte[] ObterArquivoBytes(PedidoUploadRequest uploadRequest)
    {
        if (string.IsNullOrWhiteSpace(uploadRequest.ArquivoBase64))
            return [];

        try
        {
            return Convert.FromBase64String(ObterBase64Limpo(uploadRequest.ArquivoBase64));
        }
        catch (FormatException)
        {
            AddError(nameof(uploadRequest.ArquivoBase64), "O arquivo informado não está em base64 válido.");
            throw new ValidationException(Errors);
        }
    }

    private static string ObterBase64Limpo(string arquivoBase64)
    {
        if (string.IsNullOrWhiteSpace(arquivoBase64))
            return string.Empty;

        var base64 = arquivoBase64.Trim();
        var base64Index = base64.IndexOf("base64,", StringComparison.OrdinalIgnoreCase);

        return base64Index >= 0 ? base64[(base64Index + "base64,".Length)..] : base64;
    }

    private void ValidarArquivo(PedidoUploadRequest uploadRequest, byte[] arquivo)
    {
        if (arquivo.Length <= 0)
            AddError(nameof(uploadRequest.ArquivoBase64), "Informe o arquivo do pedido.");

        if (string.IsNullOrWhiteSpace(uploadRequest.NomeArquivo))
            AddError(nameof(uploadRequest.NomeArquivo), "Informe o nome do arquivo.");

        if (arquivo.Length > MaxUploadSizeBytes)
            AddError(nameof(uploadRequest.ArquivoBase64), "O arquivo deve ter no máximo 100 MB.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private static string MontarPedidoLinkId(Guid pedidoId, string nomeArquivo)
    {
        var extension = Path.GetExtension(nomeArquivo).ToLowerInvariant();
        return $"{pedidoId:N}{extension}";
    }
}