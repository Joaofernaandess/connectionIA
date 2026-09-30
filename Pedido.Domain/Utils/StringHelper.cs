using System.Globalization;

namespace Pedido.Domain.Utils;

public static class StringHelper
{
    public static string ObterApenasNumeros(string? valor)
    {
        return new string((valor ?? string.Empty).Where(char.IsDigit).ToArray());
    }

    public static string NormalizarTitleCase(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return string.Empty;

        var textoMinusculo = texto.Trim().ToLowerInvariant();

        var titleCase = CultureInfo.InvariantCulture.TextInfo.ToTitleCase(textoMinusculo);

        string[] preposicoes = { " De ", " Da ", " Do ", " Das ", " Dos ", " E ", " Em ", " Na ", " No ", " Nas ", " Nos " };
        foreach (var prep in preposicoes)
        {
            titleCase = titleCase.Replace(prep, prep.ToLowerInvariant());
        }

        titleCase = titleCase.Replace(" S/a", " S/A");
        titleCase = titleCase.Replace(" S.a", " S.A.");
        titleCase = titleCase.Replace(" Sa", " SA");
        titleCase = titleCase.Replace(" Me", " ME");
        titleCase = titleCase.Replace(" Epp", " EPP");
        titleCase = titleCase.Replace(" Ltda", " LTDA");

        return titleCase.Trim();
    }
}