namespace Pedido.Domain.Models;

public class ProgramacaoItemRequest
{
    public Guid PedidoId { get; set; }
    public int Quantidade { get; set; }
}

public class ProgramacaoAgendaRequest
{
    public Guid AgendaId { get; set; }
    public int? QuantidadeDia { get; set; }
    public List<ProgramacaoItemRequest> Programacoes { get; set; } = new();
}

public class ProgramacaoRequest
{
    public List<ProgramacaoAgendaRequest> Agendas { get; set; } = new();
    public List<Guid> PedidosIdsRemover { get; set; } = new();
}

public class ProgramacaoResponse
{
    public Guid ProgramacaoId { get; set; }
    public Guid AgendaId { get; set; }
    public Guid PedidoId { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public string ClienteNome { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public int TotalPares { get; set; }
}