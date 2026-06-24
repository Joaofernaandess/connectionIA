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

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    [JsonPropertyOrder(5)]
    public string ConfirmaSenha { get; set; } = string.Empty;

    [JsonPropertyOrder(6)]
    public string Nome { get; set; } = string.Empty;

    [JsonIgnore]
    [JsonPropertyOrder(7)]
    public virtual PerfilUsuario Perfil { get; set; }

    [JsonIgnore]
    [JsonPropertyOrder(8)]
    public virtual bool CadastroCompleto { get; set; }

    [JsonIgnore]
    [JsonPropertyOrder(9)]
    public virtual JornadaUsuario JornadaUsuario { get; set; }
}

public class UsuarioGetResponse
{
    public Guid UsuarioId { get; set; }
    public string? Username { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? NomeUnidadeOrganizacional { get; set; }
    public bool CadastroCompleto { get; set; }
    public JornadaUsuario JornadaUsuario { get; set; }
}

public class UsuarioPatchRequest
{
    public string Nome { get; set; } = string.Empty;
}

public enum JornadaUsuario
{
    RegisterPage = 1,
    CodeValidatePage = 2,
    WaitingApprovalPage = 3,
    Completed = 4
}