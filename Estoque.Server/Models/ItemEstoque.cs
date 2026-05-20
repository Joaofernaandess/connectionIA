using System.Text.Json.Serialization;

namespace Estoque.Server.Models;

public class ItemEstoque
{
    [JsonIgnore]
    [JsonPropertyOrder(1)]
    public virtual Guid ItemEstoqueId { get; set; }

    [JsonPropertyOrder(2)]
    public virtual Guid UnidadeOrganizacionalId { get; set; }

    [JsonPropertyOrder(3)]
    public virtual Guid EspacoId { get; set; }

    [JsonPropertyOrder(4)]
    public string Descricao { get; set; } = string.Empty;

    [JsonPropertyOrder(5)]
    public TipoUnidadeMedida TipoUnidadeMedida { get; set; }

    [JsonPropertyOrder(6)]
    public decimal Quantidade { get; set; }
}

public class ItemEstoqueAtualizado : ItemEstoque
{
    [JsonIgnore]
    [JsonPropertyOrder(2)]
    public override Guid UnidadeOrganizacionalId { get; set; }
}

public class ItemEstoqueRecuperado : ItemEstoque
{
    [JsonPropertyOrder(1)]
    public override Guid ItemEstoqueId { get; set; }
}