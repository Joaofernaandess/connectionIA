namespace Estoque.Server.Models;

public enum PerfilUsuario
{
    Admin = 1,
    Normal = 2
}

public enum TipoUnidadeMedida
{
    Quilos = 1,
    Gramas = 2,
    Miligramas = 3,
    Litros = 4,
    Mililitros = 5,
    Unidades = 6
}

public enum TipoMovimentacao
{
    Acrescimo = 1,
    Subtracao = 2
}