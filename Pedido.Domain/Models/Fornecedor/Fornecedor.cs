using Pedido.Domain.Utils;

namespace Pedido.Domain.Models;

public class Fornecedor
{
    public Guid FornecedorId { get; set; }
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string? Sigla { get; set; }
    public List<FornecedorEndereco> Enderecos { get; set; } = new();
    public List<FornecedorContato> Contatos { get; set; } = new();

    public void Normalizar()
    {
        RazaoSocial = StringHelper.NormalizarTitleCase(RazaoSocial);
        Fantasia = StringHelper.NormalizarTitleCase(Fantasia);
        Sigla = string.IsNullOrWhiteSpace(Sigla) ? null : Sigla.Trim().ToUpperInvariant();
    }
}

public class FornecedorPostRequest
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Sigla { get; set; }

    public void Normalizar()
    {
        RazaoSocial = StringHelper.NormalizarTitleCase(RazaoSocial);
        Fantasia = StringHelper.NormalizarTitleCase(Fantasia);
        Sigla = string.IsNullOrWhiteSpace(Sigla) ? null : Sigla.Trim().ToUpperInvariant();
    }
}

public class FornecedorPutRequest
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string? Sigla { get; set; }

    public void Normalizar()
    {
        RazaoSocial = StringHelper.NormalizarTitleCase(RazaoSocial);
        Fantasia = StringHelper.NormalizarTitleCase(Fantasia);
        Sigla = string.IsNullOrWhiteSpace(Sigla) ? null : Sigla.Trim().ToUpperInvariant();
    }
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
    public string? Sigla { get; set; }
}