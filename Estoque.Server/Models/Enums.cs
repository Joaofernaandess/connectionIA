namespace Estoque.Server.Models;

public enum PerfilUsuario
{
    Admin = 1,
    Normal = 2
}

public enum TipoUnidadeMedida
{
    Litros = 1,
    Mililitros = 2,
    Quilos = 3,
    Gramas = 4,
    Miligramas = 5,
    Unidades = 6
}

public enum TipoMovimentacao
{
    Acrescimo = 1,
    Subtracao = 2,
    Transferencia = 3
}