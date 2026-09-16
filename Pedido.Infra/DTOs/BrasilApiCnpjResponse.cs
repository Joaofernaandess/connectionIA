using System.Text.Json.Serialization;

namespace Pedido.Infra.DTOs;

public class BrasilApiCnpjResponse
{
    [JsonPropertyName("cnpj")]
    public string? Cnpj { get; set; }

    [JsonPropertyName("razao_social")]
    public string? RazaoSocial { get; set; }

    [JsonPropertyName("nome_fantasia")]
    public string? NomeFantasia { get; set; }

    [JsonPropertyName("descricao_tipo_de_logradouro")]
    public string? DescricaoTipoLogradouro { get; set; }

    [JsonPropertyName("logradouro")]
    public string? Logradouro { get; set; }

    [JsonPropertyName("numero")]
    public string? Numero { get; set; }

    [JsonPropertyName("complemento")]
    public string? Complemento { get; set; }

    [JsonPropertyName("bairro")]
    public string? Bairro { get; set; }

    [JsonPropertyName("municipio")]
    public string? Municipio { get; set; }

    [JsonPropertyName("uf")]
    public string? Uf { get; set; }

    [JsonPropertyName("cep")]
    public string? Cep { get; set; }

    [JsonPropertyName("ddd_telefone_1")]
    public string? DddTelefone1 { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }
}
