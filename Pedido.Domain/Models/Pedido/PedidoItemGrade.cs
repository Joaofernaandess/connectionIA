namespace Pedido.Domain.Models;

public class PedidoItemGrade
{
    public Guid PedidoItemGradeId { get; set; }
    public Guid PedidoItemId { get; set; }
    public string Numeracao { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}

public class PedidoItemGradePostRequest
{
    public string Numeracao { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}
