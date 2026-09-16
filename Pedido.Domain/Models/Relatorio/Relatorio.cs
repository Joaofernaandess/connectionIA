namespace Pedido.Domain.Models;

public class RelatorioFiltroRequest
{
    public DateTime? DataInicial { get; set; }
    public DateTime? DataFinal { get; set; }
    public List<Guid>? ClienteIds { get; set; } = new();
    public bool Analitico { get; set; }
    public bool IncluirGraficoBarras { get; set; }
}

public class RelatorioDiaResponse
{
    public string Data { get; set; } = string.Empty;
    public int TotalPares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal TotalLiquido { get; set; }
    public List<RelatorioClienteDetalhe>? Detalhes { get; set; }
}

public class RelatorioClienteDetalhe
{
    public Guid ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public int Pares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal TotalLiquido { get; set; }
}