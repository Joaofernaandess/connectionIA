namespace Pedido.Domain.Models;

public class PedidoAnaliseIARequest
{
    public string Cliente { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string NumeroPedido { get; set; } = string.Empty;
    public DateTime? DataEmissao { get; set; }
    public DateTime? DataFaturamento { get; set; }
    public string CondicaoPagamento { get; set; } = string.Empty;
    public string Representante { get; set; } = string.Empty;
    public string Fornecedor { get; set; } = string.Empty;
    public decimal PercentualDesconto { get; set; }
    public int TotalPares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal TotalLiquido { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public List<PedidoItemPostRequest> Itens { get; set; } = new();
}
