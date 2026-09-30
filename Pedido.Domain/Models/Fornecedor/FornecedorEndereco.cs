using Pedido.Domain.Utils;

namespace Pedido.Domain.Models;

public class FornecedorEndereco
{
    public Guid FornecedorEnderecoId { get; set; }
    public Guid FornecedorId { get; set; }
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Complemento { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;
    public bool Default { get; set; }

    public void Normalizar()
    {
        Logradouro = StringHelper.NormalizarTitleCase(Logradouro);
        Complemento = StringHelper.NormalizarTitleCase(Complemento);
        Bairro = StringHelper.NormalizarTitleCase(Bairro);
        Cidade = StringHelper.NormalizarTitleCase(Cidade);
        Uf = (Uf ?? string.Empty).Trim().ToUpperInvariant();
    }
}

public class FornecedorEnderecoPostRequest
{
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Complemento { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;
    public bool Default { get; set; }

    public void Normalizar()
    {
        Logradouro = StringHelper.NormalizarTitleCase(Logradouro);
        Complemento = StringHelper.NormalizarTitleCase(Complemento);
        Bairro = StringHelper.NormalizarTitleCase(Bairro);
        Cidade = StringHelper.NormalizarTitleCase(Cidade);
        Uf = (Uf ?? string.Empty).Trim().ToUpperInvariant();
    }
}

public class FornecedorEnderecoPutRequest
{
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Complemento { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;

    public void Normalizar()
    {
        Logradouro = StringHelper.NormalizarTitleCase(Logradouro);
        Complemento = StringHelper.NormalizarTitleCase(Complemento);
        Bairro = StringHelper.NormalizarTitleCase(Bairro);
        Cidade = StringHelper.NormalizarTitleCase(Cidade);
        Uf = (Uf ?? string.Empty).Trim().ToUpperInvariant();
    }
}

public class FornecedorEnderecoValidacaoRequest : FornecedorEnderecoPutRequest
{
    public Guid? FornecedorEnderecoId { get; set; }
}