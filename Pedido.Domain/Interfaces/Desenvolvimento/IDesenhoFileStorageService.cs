namespace Pedido.Domain.Interfaces;

public interface IDesenhoFileStorageService
{
    Task EnviarArquivo(string key, byte[] arquivo, string? contentType);
    Task<(string ArquivoBase64, string ContentType)> ObterArquivoBase64(string key);
    string GerarUrlVisualizacao(string key);
}
