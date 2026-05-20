using System.Text.Json.Serialization;

namespace Estoque.Server.Models;

public class Historico
{
    [JsonIgnore]
    [JsonPropertyOrder(1)]
    public virtual Guid HistoricoId { get; set; }

    [JsonPropertyOrder(2)]
    public virtual Guid ItemEstoqueId { get; set; }

    [JsonPropertyOrder(3)]
    public TipoMovimentacao TipoMovimentacao { get; set; }

    [JsonPropertyOrder(4)]
    public virtual Guid? UsuarioId { get; set; }

    [JsonPropertyOrder(5)]
    public string? Nome { get; set; }

    [JsonPropertyOrder(6)]
    public DateTime DataHora { get; set; } = DateTime.UtcNow;

    [JsonPropertyOrder(7)]
    public decimal QuantidadeAnterior { get; set; }

    [JsonPropertyOrder(8)]
    public decimal QuantidadeResultante { get; set; }
}

public class HistoricoRecuperado : Historico
{
    [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
    [JsonPropertyOrder(1)]
    public override Guid HistoricoId { get; set; }
}