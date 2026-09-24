namespace Pedido.Domain.Models;

public class ReferenciaDesenho
{
    public Guid ReferenciaDesenhoId { get; set; }
    public Guid ReferenciaId { get; set; }
    public string ReferenciaDesenhoLinkId { get; set; } = string.Empty;
    public bool DesenhoOriginal { get; set; } = true;
}

public class ReferenciaDesenhoUploadRequest
{
    public string ArquivoBase64 { get; set; } = string.Empty;
    public string NomeArquivo { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}

public class ReferenciaDesenhoResponse
{
    public Guid ReferenciaDesenhoId { get; set; }
    public Guid ReferenciaId { get; set; }
    public string ReferenciaDesenhoLinkId { get; set; } = string.Empty;
    public bool DesenhoOriginal { get; set; }
    public string UrlVisualizacao { get; set; } = string.Empty;
    public string ArquivoBase64 { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}