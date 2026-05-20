using System.Text.Json.Serialization;

namespace Estoque.Server.Models;

public class UnidadeOrganizacional
{
    [JsonIgnore]
    [JsonPropertyOrder(1)]
    public virtual Guid UnidadeOrganizacionalId { get; set; }

    [JsonPropertyOrder(2)]
    public Guid? MatrizId { get; set; }

    [JsonPropertyOrder(3)]
    public string Cnpj { get; set; } = string.Empty;

    [JsonPropertyOrder(4)]
    public string RazaoSocial { get; set; } = string.Empty;

    [JsonPropertyOrder(5)]
    public string? NomeFantasia { get; set; } = string.Empty;

    [JsonPropertyOrder(6)]
    public string? Cep { get; set; } = string.Empty;

    [JsonPropertyOrder(7)]
    public string? Endereco { get; set; } = string.Empty;

    [JsonPropertyOrder(8)]
    public string? Numero { get; set; } = string.Empty;

    [JsonPropertyOrder(9)]
    public string? Complemento { get; set; } = string.Empty;

    [JsonPropertyOrder(10)]
    public string? Bairro { get; set; } = string.Empty;

    [JsonPropertyOrder(11)]
    public string? Cidade { get; set; } = string.Empty;

    [JsonPropertyOrder(12)]
    public string? Uf { get; set; } = string.Empty;

    [JsonPropertyOrder(13)]
    public string? Pais { get; set; } = string.Empty;

    [JsonPropertyOrder(14)]
    public string? Email { get; set; } = string.Empty;

    [JsonPropertyOrder(15)]
    public string? Telefone { get; set; } = string.Empty;
}

public class UnidadeOrganizacionalGetResponse : UnidadeOrganizacional
{
    [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
    [JsonPropertyOrder(1)]
    public override Guid UnidadeOrganizacionalId { get; set; }
}