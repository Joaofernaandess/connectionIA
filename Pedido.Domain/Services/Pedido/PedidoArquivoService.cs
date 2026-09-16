using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class PedidoArquivoService
{
    private const int ArquivoTokenExpiracaoSegundos = 60;

    private readonly IPedidoRepository _pedidoRepository;
    private readonly IPedidoFileStorageService _fileStorageService;
    private readonly IPedidoArquivoTokenService _pedidoArquivoTokenService;

    public PedidoArquivoService(
        IPedidoRepository pedidoRepository,
        IPedidoFileStorageService fileStorageService,
        IPedidoArquivoTokenService pedidoArquivoTokenService)
    {
        _pedidoRepository = pedidoRepository;
        _fileStorageService = fileStorageService;
        _pedidoArquivoTokenService = pedidoArquivoTokenService;
    }

    public async Task<PedidoArquivoTokenResponse> GerarTokenArquivo(Guid pedidoId)
    {
        try
        {
            var pedido = await _pedidoRepository.Obter(pedidoId);

            if (pedido == null) throw new NotFoundException("Pedido não encontrado com o ID informado.");

            if (string.IsNullOrWhiteSpace(pedido.PedidoLinkId))
                throw new NotFoundException("Arquivo do pedido não encontrado.");

            var tokenInfo = _pedidoArquivoTokenService.Gerar(pedidoId, ArquivoTokenExpiracaoSegundos);

            return new PedidoArquivoTokenResponse
            {
                Url = $"v1/pedidos/{pedidoId}/arquivo/visualizar?token={tokenInfo.Token}",
                ExpiraEm = tokenInfo.ExpiraEm
            };
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao gerar token do arquivo do pedido: {ex.Message}");
        }
    }

    public async Task<PedidoArquivoResponse> ObterArquivo(Guid pedidoId, string token)
    {
        try
        {
            ValidarTokenArquivo(pedidoId, token);

            var pedido = await _pedidoRepository.Obter(pedidoId);

            if (pedido == null) throw new NotFoundException("Pedido não encontrado com o ID informado.");

            if (string.IsNullOrWhiteSpace(pedido.PedidoLinkId))
                throw new NotFoundException("Arquivo do pedido não encontrado.");

            var arquivo = await _fileStorageService.ObterArquivo(pedido.PedidoLinkId);

            return new PedidoArquivoResponse
            {
                NomeArquivo = arquivo.NomeArquivo,
                ContentType = arquivo.ContentType,
                Arquivo = arquivo.Arquivo
            };
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter arquivo do pedido: {ex.Message}");
        }
    }

    public void ValidarTokenArquivo(Guid pedidoId, string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token) ||
                !_pedidoArquivoTokenService.Validar(pedidoId, token))
                throw new UnauthorizedAccessException("Token do arquivo inválido ou expirado.");
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao validar token do arquivo do pedido: {ex.Message}");
        }
    }
}