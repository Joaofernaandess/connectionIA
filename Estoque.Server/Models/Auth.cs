using System.Text.Json.Serialization;

namespace Estoque.Server.Models;

public class Auth
{
    [JsonPropertyOrder(1)]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyOrder(2)]
    public virtual string Senha { get; set; } = string.Empty;

    [JsonPropertyOrder(3)]
    public virtual Guid? UnidadeOrganizacionalId { get; set; }
}

public class AuthForgot : Auth
{
    [JsonIgnore]
    public override string Senha { get; set; } = string.Empty;
}

public class AuthVerify
{
    public string Code { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public Guid? UnidadeOrganizacionalId { get; set; }
}

public class AuthReset
{
    public string CodigoAcessoId { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string ConfirmaSenha { get; set; } = string.Empty;
}

public class AuthLoginResponse
{
    public string? Token { get; set; }
    public JornadaUsuario? JornadaUsuario { get; set; }
    public string? Message { get; set; }
}

public class AuthVerifyResponse
{
    public string? CodigoResetId { get; set; }
    public JornadaUsuario? JornadaUsuario { get; set; }
    public string? Message { get; set; }
}