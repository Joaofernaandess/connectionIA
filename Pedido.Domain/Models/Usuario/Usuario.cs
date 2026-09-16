using System.Text.Json.Serialization;

namespace Pedido.Domain.Models;

public class Usuario
{
    [JsonIgnore]
    [JsonPropertyOrder(1)]
    public virtual Guid UsuarioId { get; set; }

    [JsonPropertyOrder(2)]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyOrder(3)]
    public string Senha { get; set; } = string.Empty;

    [JsonPropertyOrder(4)]
    public string Nome { get; set; } = string.Empty;

    [JsonPropertyOrder(5)]
    public string ConfirmaSenha { get; set; } = string.Empty;

    [JsonIgnore]
    [JsonPropertyOrder(6)]
    public virtual PerfilUsuario Perfil { get; set; }

    [JsonIgnore]
    [JsonPropertyOrder(7)]
    public virtual bool CadastroCompleto { get; set; }

    [JsonIgnore]
    [JsonPropertyOrder(8)]
    public virtual JornadaUsuario JornadaUsuario { get; set; }
}

public class UsuarioGetResponse
{
    public Guid UsuarioId { get; set; }
    public string? Username { get; set; }
    public string Nome { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; }
    public bool CadastroCompleto { get; set; }
    public JornadaUsuario JornadaUsuario { get; set; }
}

public class UsuarioGetRequest : GetQueryRequestBase
{
    public string? Username { get; set; } = string.Empty;
    public bool? CadastroCompleto { get; set; } = null;
}

public class UsuarioPutRequest
{
    public string Nome { get; set; } = string.Empty;
}