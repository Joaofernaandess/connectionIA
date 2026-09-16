namespace Pedido.Domain.Models;

public class PedidoUploadRequest
{
    public string ArquivoBase64 { get; set; } = string.Empty;
    public string NomeArquivo { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}

public class PedidoUploadResponse
{
    public Guid PedidoId { get; set; }
    public string PedidoLinkId { get; set; } = string.Empty;
    public string AnaliseIA { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public bool ArquivoSeparado { get; set; }
    public List<PedidoUploadItemResponse> Pedidos { get; set; } = new();
}

public class PedidoUploadItemResponse
{
    public Guid PedidoId { get; set; }
    public string PedidoLinkId { get; set; } = string.Empty;
    public string NomeArquivo { get; set; } = string.Empty;
    public int PaginaInicial { get; set; }
    public int PaginaFinal { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PedidoArquivoSeparado
{
    public byte[] Arquivo { get; set; } = Array.Empty<byte>();
    public string NomeArquivo { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public int PaginaInicial { get; set; }
    public int PaginaFinal { get; set; }
}

public class PedidoAnaliseIAResponse
{
    public string WebhookToken { get; set; } = string.Empty;
    public string ClienteCnpj { get; set; } = string.Empty;
    public string FornecedorCnpj { get; set; } = string.Empty;
    public string NumeroPedido { get; set; } = string.Empty;
    public string DataEmissao { get; set; } = string.Empty;
    public string DataFaturamento { get; set; } = string.Empty;
    public string CondicaoPagamento { get; set; } = string.Empty;
    public string Representante { get; set; } = string.Empty;
    public decimal PercentualDesconto { get; set; }
    public int TotalPares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal TotalLiquido { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public List<PedidoAnaliseIAItem> Itens { get; set; } = new();
}

public class PedidoAnaliseIAItem
{
    public int Sequencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string MaterialCor { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public List<PedidoAnaliseIAGrade> Grades { get; set; } = new();
}

public class PedidoAnaliseIAGrade
{
    public string Numeracao { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}
