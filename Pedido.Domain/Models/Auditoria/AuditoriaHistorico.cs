namespace Pedido.Domain.Models;

public class AuditoriaHistoricoGetRequest : GetQueryRequestBase
{
    public Guid? ReferenciaId { get; set; }
    public Guid? LinhaId { get; set; }
}

public class AuditoriaHistoricoResponse
{
    public DateTime Data { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Entidade { get; set; } = string.Empty;
    public Guid EntidadeId { get; set; }
}
