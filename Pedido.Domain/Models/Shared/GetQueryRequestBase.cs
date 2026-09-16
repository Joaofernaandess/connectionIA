namespace Pedido.Domain.Models;

public class GetQueryRequestBase
{
    public int? Skip { get; set; } = 0;
    public int? Top { get; set; } = 10;
    public string? Sort { get; set; } = string.Empty;
}
