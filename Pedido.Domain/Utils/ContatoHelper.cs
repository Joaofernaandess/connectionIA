using Pedido.Domain.Models;
using System.Text.RegularExpressions;

namespace Pedido.Domain.Utils;

public static class ContatoHelper
{
    public static string NormalizarValor(TipoContato tipoContato, string? valor)
    {
        return tipoContato == TipoContato.Telefone
            ? StringHelper.ObterApenasNumeros(valor)
            : (valor ?? string.Empty).Trim();
    }

    public static bool TelefoneValido(string? valor)
    {
        var digitos = StringHelper.ObterApenasNumeros(valor);
        return digitos.Length is 10 or 11;
    }

    public static bool EmailValido(string? valor)
    {
        var email = (valor ?? string.Empty).Trim();
        return Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    }
}
