namespace Pedido.Domain.Models;

public class AuthUsuario
{
    public Guid UsuarioId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; }
    public bool CadastroCompleto { get; set; }
    public JornadaUsuario JornadaUsuario { get; set; }
}