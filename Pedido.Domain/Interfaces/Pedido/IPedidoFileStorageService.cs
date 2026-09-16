namespace Pedido.Domain.Interfaces;

public interface IPedidoFileStorageService
{
    Task<string> EnviarArquivo(string pedidoLinkId, byte[] arquivo, string? contentType);
    Task<(byte[] Arquivo, string ContentType, string NomeArquivo)> ObterArquivo(string pedidoLinkId);
}
