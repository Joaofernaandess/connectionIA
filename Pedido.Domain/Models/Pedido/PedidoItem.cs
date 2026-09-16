namespace Pedido.Domain.Models;

public class PedidoItem
{
    public Guid PedidoItemId { get; set; }
    public Guid PedidoId { get; set; }
    public int Sequencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string MaterialCor { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public List<PedidoItemGrade> Grades { get; set; } = new();
}

public class PedidoItemPostRequest
{
    public int Sequencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string MaterialCor { get; set; } = string.Empty;
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public List<PedidoItemGradePostRequest> Grades { get; set; } = new();
}

public class PedidoItemGetResponse
{
    public Guid PedidoItemId { get; set; }
    public Guid PedidoId { get; set; }
    public int Sequencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string MaterialCor { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public List<PedidoItemGrade> Grades { get; set; } = new();
}
