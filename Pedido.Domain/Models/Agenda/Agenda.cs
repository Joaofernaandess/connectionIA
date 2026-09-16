namespace Pedido.Domain.Models;

public class AgendaPostRequest
{
    public List<DateTime> AgendaItems { get; set; } = new();
    public bool Util { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

public class AgendaItem
{
    public DateTime Data { get; set; }
    public bool Util { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

public class AgendaPutRequest
{
    public DateTime? Data { get; set; }
    public bool Util { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

public class AgendaResponse
{
    public Guid AgendaId { get; set; }
    public DateTime Data { get; set; }
    public DateTime DataProgramacao
    {
        get => Data;
        set => Data = value;
    }
    public bool Util { get; set; }
    public bool DiasUteis
    {
        get => Util;
        set => Util = value;
    }
    public string Motivo { get; set; } = string.Empty;
    public decimal Metrica { get; set; }
    public Guid? ProgramacaoId { get; set; }
    public Guid? PedidoId { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public string ClienteNome { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public int TotalPares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal TotalLiquido { get; set; }
}