namespace Pedido.Domain.Models;

public class ReferenciaPrototipo
{
    public Guid ReferenciaPrototipoId { get; set; }
    public Guid ReferenciaId { get; set; }
    public Guid ReferenciaDesenhoId { get; set; }
    public Guid CorId { get; set; }
}

public class ReferenciaPrototipoResponse
{
    public Guid ReferenciaPrototipoId { get; set; }
    public Guid ReferenciaId { get; set; }
    public Guid ReferenciaDesenhoId { get; set; }
    public Guid CorId { get; set; }
}
