using System.Text.Json.Serialization;

namespace Estoque.Server.Models;

public class Usuario
{
    [JsonIgnore]
    [JsonPropertyOrder(1)]
    public virtual Guid UsuarioId { get; set; }

    [JsonPropertyOrder(2)]
    public virtual Guid? UnidadeOrganizacionalId { get; set; }

    [JsonPropertyOrder(3)]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyOrder(4)]
    public string Senha { get; set; } = string.Empty;

    [JsonPropertyOrder(5)]
    public string Nome { get; set; } = string.Empty;

    [JsonIgnore]
    [JsonPropertyOrder(6)]
    public virtual PerfilUsuario Perfil { get; set; }

    [JsonIgnore]
    [JsonPropertyOrder(7)]
    public virtual bool Valido { get; set; }
}

public class UsuarioGetResponse
{
    public Guid UsuarioId { get; set; }
    public string? Username { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? NomeUnidadeOrganizacional { get; set; }
    public bool Valido { get; set; }
}

public class UsuarioPutRequest
{
    public string Nome { get; set; } = string.Empty;
    public string? Senha { get; set; }
    public string? ConfirmaSenha { get; set; }
}