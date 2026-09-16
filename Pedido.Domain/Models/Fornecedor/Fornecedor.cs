namespace Pedido.Domain.Models;

public class Fornecedor
{
    public Guid FornecedorId { get; set; }
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public List<FornecedorEndereco> Enderecos { get; set; } = new();
    public List<FornecedorContato> Contatos { get; set; } = new();
}

public class FornecedorPostRequest
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
}

public class FornecedorPutRequest
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
}

public class FornecedorGetRequest : GetQueryRequestBase
{
    public string? RazaoSocial { get; set; } = string.Empty;
    public string? Cnpj { get; set; } = string.Empty;
}

public class FornecedorGetResponse
{
    public Guid FornecedorId { get; set; }
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
}