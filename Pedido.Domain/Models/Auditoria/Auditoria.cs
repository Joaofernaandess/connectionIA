namespace Pedido.Domain.Models;

public class AuditoriaUsuario
{
    public Guid? UsuarioId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
}

public class AuditoriaAlteracao
{
    public string Campo { get; set; } = string.Empty;
    public string CampoDescricao { get; set; } = string.Empty;
    public string? ValorAnterior { get; set; }
    public string? ValorNovo { get; set; }
}

public class AuditoriaEvento
{
    public string Acao { get; set; } = string.Empty;
    public string Entidade { get; set; } = string.Empty;
    public Guid EntidadeId { get; set; }
    public AuditoriaUsuario Usuario { get; set; } = new();
    public string Descricao { get; set; } = string.Empty;
    public List<AuditoriaAlteracao> Alteracoes { get; set; } = [];
    public DateTime Data { get; set; }
}