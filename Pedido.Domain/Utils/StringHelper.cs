namespace Pedido.Domain.Utils;

public static class StringHelper
{
    public static string ObterApenasNumeros(string? valor)
    {
        return new string((valor ?? string.Empty).Where(char.IsDigit).ToArray());
    }
}
