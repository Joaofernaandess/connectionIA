using System.Text.Json.Serialization;

namespace Pedido.Domain.Models;

public class Auth
{
    [JsonPropertyOrder(1)]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyOrder(2)]
    public virtual string Senha { get; set; } = string.Empty;
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
}

public class AuthReset
{
    public string CodigoAcessoId { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string ConfirmaSenha { get; set; } = string.Empty;
}

public class AuthToken
{
    public string Token { get; set; } = string.Empty;
    public JornadaUsuario? JornadaUsuario { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AuthVerifyResponse
{
    public string CodigoAcessoId { get; set; } = string.Empty;
    public string CodigoResetId { get; set; } = string.Empty;
    public JornadaUsuario? JornadaUsuario { get; set; }
    public string Message { get; set; } = string.Empty;
}