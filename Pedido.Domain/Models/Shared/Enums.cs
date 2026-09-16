namespace Pedido.Domain.Models;

public enum PerfilUsuario
{
    Gestor = 1,
    Normal = 2,
    Admin = 3
}

public enum JornadaUsuario
{
    RegisterPage = 1,
    CodeValidatePage = 2,
    WaitingApprovalPage = 3,
    Completed = 4
}

public enum TipoContato
{
    Telefone = 1,
    Email = 2,
    EmailNfe = 3
}

public enum PedidoStatus
{
    AguardandoAnaliseIA = 1,
    AguardandoAnaliseGestor = 2,
    PedidoProcessado = 3,
    Programado = 4,
    ReprovadoPeloGestor = 5
}

public enum PedidoAvaliacaoNotaEnum
{
    Péssimo = 1,
    Ruim = 2,
    Regular = 3,
    Bom = 4,
    Ótimo = 5
}

public enum CategoriaLinhaProduto
{
    Adulto = 1,
    Infantil = 2
}

public enum GeneroLinhaProduto
{
    Masculino = 1,
    Feminino = 2
}

public enum ProcessoProdutivoLinhaProduto
{
    InjecaoDireta = 1,
    Montado = 2
}