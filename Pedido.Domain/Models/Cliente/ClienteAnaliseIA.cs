namespace Pedido.Domain.Models;

public class ClienteAnaliseIARequest
{
    public string Cnpj { get; set; } = string.Empty;
}

public class ClienteAnaliseIADados
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string Fantasia { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string InscricaoEstadual { get; set; } = string.Empty;
    public List<ClienteAnaliseIAEndereco> Enderecos { get; set; } = new();
    public List<ClienteAnaliseIAContato> Contatos { get; set; } = new();
}

public class ClienteAnaliseIAEndereco
{
    public string Logradouro { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Complemento { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;
}

public class ClienteAnaliseIAContato
{
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
}