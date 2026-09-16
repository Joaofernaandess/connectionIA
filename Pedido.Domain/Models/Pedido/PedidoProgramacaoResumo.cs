namespace Pedido.Domain.Models;

public class PedidoProgramacaoResumo
{
    public Guid PedidoId { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public PedidoStatus Status { get; set; }
    public int TotalPares { get; set; }
    public int QuantidadeProgramada { get; set; }
}