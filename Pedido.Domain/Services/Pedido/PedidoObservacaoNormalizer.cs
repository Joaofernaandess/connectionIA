using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Pedido.Domain.Services;

public static class PedidoObservacaoNormalizer
{
    public static string Normalizar(string observacoes)
    {
        if (string.IsNullOrWhiteSpace(observacoes))
            return string.Empty;

        var culture = new CultureInfo("pt-BR");
        var texto = Limpar(observacoes).ToLower(culture);
        var resultado = new StringBuilder(texto.Length);
        var proximaLetraMaiuscula = true;

        foreach (var caractere in texto)
        {
            if (proximaLetraMaiuscula && char.IsLetter(caractere))
            {
                resultado.Append(char.ToUpper(caractere, culture));
                proximaLetraMaiuscula = false;
                continue;
            }

            resultado.Append(caractere);

            if (caractere == '.' || caractere == '\n')
                proximaLetraMaiuscula = true;
            else if (!char.IsWhiteSpace(caractere))
                proximaLetraMaiuscula = false;
        }

        return resultado.ToString();
    }

    private static string Limpar(string observacoes)
    {
        var textoNormalizado = observacoes
            .Replace("\r\n", "\n")
            .Replace('\r', '\n');

        var textoSemMarkdown = new StringBuilder(textoNormalizado.Length);

        foreach (var caractere in textoNormalizado)
        {
            if (caractere == '*')
            {
                textoSemMarkdown.Append(' ');
                continue;
            }

            textoSemMarkdown.Append(caractere == '\n' || !char.IsWhiteSpace(caractere) ? caractere : ' ');
        }

        var textoCompactado = new StringBuilder(textoSemMarkdown.Length);
        var ultimoFoiEspaco = true;
        var quebrasConsecutivas = 0;

        foreach (var caractere in textoSemMarkdown.ToString())
        {
            if (caractere == '\n')
            {
                while (textoCompactado.Length > 0 && textoCompactado[^1] == ' ')
                    textoCompactado.Length--;

                if (quebrasConsecutivas < 2 && textoCompactado.Length > 0)
                    textoCompactado.Append(caractere);

                ultimoFoiEspaco = true;
                quebrasConsecutivas++;
                continue;
            }

            if (caractere == ' ')
            {
                if (!ultimoFoiEspaco)
                    textoCompactado.Append(caractere);

                ultimoFoiEspaco = true;
                continue;
            }

            if (EhPontuacao(caractere) && textoCompactado.Length > 0 && textoCompactado[^1] == ' ')
                textoCompactado.Length--;

            textoCompactado.Append(caractere);
            ultimoFoiEspaco = false;
            quebrasConsecutivas = 0;
        }

        return RemoverRotulosVazios(textoCompactado.ToString().Trim(' ', '\n'));
    }

    private static string RemoverRotulosVazios(string observacoes)
    {
        var texto = Regex.Replace(observacoes, @"(?i)\bMarca\s*:\s*[\.;,-]\s*", string.Empty);
        texto = Regex.Replace(texto, @"(?i)\bMarca\s*:\s*(?=Descricao\s*:)", string.Empty);
        texto = Regex.Replace(texto, @"(?i)\bDescricao\s*:\s*[\.;,-]\s*", string.Empty);

        return texto.Trim(' ', '.', ',', ';', '-');
    }

    private static bool EhPontuacao(char caractere)
    {
        return caractere == '.' ||
            caractere == ',' ||
            caractere == ';' ||
            caractere == ':' ||
            caractere == '!' ||
            caractere == '?';
    }
}