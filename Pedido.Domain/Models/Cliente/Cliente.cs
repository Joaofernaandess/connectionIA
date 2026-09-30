using Pedido.Domain.Utils;

namespace Pedido.Domain.Models;

public class Cliente
{
    public Guid ClienteId { get; set; }
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string? Sigla { get; set; }
    public List<ClienteEndereco> Enderecos { get; set; } = new();
    public List<ClienteContato> Contatos { get; set; } = new();

    public void Normalizar()
    {
        RazaoSocial = StringHelper.NormalizarTitleCase(RazaoSocial);
        Fantasia = StringHelper.NormalizarTitleCase(Fantasia);
        Sigla = string.IsNullOrWhiteSpace(Sigla) ? null : Sigla.Trim().ToUpperInvariant();
    }
}

public class ClientePostRequest
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

public class ClientePutRequest
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

public class ClienteGetRequest : GetQueryRequestBase
{
    public string? RazaoSocial { get; set; } = string.Empty;
    public string? Cnpj { get; set; } = string.Empty;
}

public class ClienteGetResponse
{
    public Guid ClienteId { get; set; }
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? Sigla { get; set; }
}