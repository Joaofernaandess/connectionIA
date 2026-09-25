using System.Collections;
using System.Globalization;
using System.Reflection;
using Pedido.Domain.Models;

namespace Pedido.Infra.Services;

public static class AuditoriaComparador
{
    private static readonly CultureInfo Cultura = new("pt-BR");

    private static readonly Dictionary<string, string> Campos = new(StringComparer.OrdinalIgnoreCase)
    {
        ["NumeroLinha"] = "linha",
        ["NumeroInicial"] = "número inicial",
        ["NumeroFinal"] = "número final",
        ["Categoria"] = "categoria",
        ["Genero"] = "gênero",
        ["Exclusiva"] = "exclusiva",
        ["Cliente"] = "cliente",
        ["ProcessoProdutivo"] = "processo produtivo",
        ["Fabricante"] = "fabricante",
        ["Rendimento"] = "rendimento",
        ["NumeroReferencia"] = "número da referência",
        ["Sigla"] = "sigla",
        ["Observacao"] = "observação"
    };

    private static readonly HashSet<string> CamposIgnorados = new(StringComparer.OrdinalIgnoreCase)
    {
        "DataCriacao",
        "Cores",
        "ClienteId",
        "FabricanteId",
        "LinhaId",
        "ReferenciaId",
        "CodigoReferencia"
    };

    public static List<AuditoriaAlteracao> Comparar<T>(T? anterior, T? novo)
    {
        if (novo == null)
            return [];

        var tipo = novo.GetType();
        var propriedades = tipo
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(DeveComparar);

        var alteracoes = new List<AuditoriaAlteracao>();

        foreach (var propriedade in propriedades)
        {
            var valorAnterior = anterior == null ? null : propriedade.GetValue(anterior);
            var valorNovo = propriedade.GetValue(novo);

            if (ValoresIguais(valorAnterior, valorNovo))
                continue;

            alteracoes.Add(new AuditoriaAlteracao
            {
                Campo = propriedade.Name,
                CampoDescricao = ObterDescricaoCampo(propriedade.Name),
                ValorAnterior = FormatarValor(valorAnterior),
                ValorNovo = FormatarValor(valorNovo)
            });
        }

        return alteracoes;
    }

    private static bool DeveComparar(PropertyInfo propriedade)
    {
        if (!propriedade.CanRead)
            return false;

        if (CamposIgnorados.Contains(propriedade.Name))
            return false;

        if (propriedade.PropertyType != typeof(string)
            && typeof(IEnumerable).IsAssignableFrom(propriedade.PropertyType))
            return false;

        return propriedade.GetIndexParameters().Length == 0;
    }

    private static bool ValoresIguais(object? valorAnterior, object? valorNovo)
    {
        var anterior = FormatarValor(valorAnterior);
        var novo = FormatarValor(valorNovo);

        return string.Equals(anterior, novo, StringComparison.Ordinal);
    }

    private static string ObterDescricaoCampo(string campo)
    {
        return Campos.TryGetValue(campo, out var descricao)
            ? descricao
            : campo;
    }

    private static string? FormatarValor(object? valor)
    {
        if (valor == null)
            return null;

        if (valor is string texto)
            return string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

        if (valor is bool booleano)
            return booleano ? "Sim" : "Não";

        if (valor is decimal decimalValor)
            return decimalValor.ToString("0.##", Cultura);

        if (valor is double doubleValor)
            return doubleValor.ToString("0.##", Cultura);

        if (valor is float floatValor)
            return floatValor.ToString("0.##", Cultura);

        if (valor is DateTime data)
            return data.ToString("dd/MM/yyyy HH:mm:ss", Cultura);

        if (valor is Enum enumValor)
            return FormatarEnum(enumValor);

        return Convert.ToString(valor, Cultura);
    }

    private static string FormatarEnum(Enum valor)
    {
        return valor switch
        {
            GeneroLinha.Masculino => "Masculino",
            GeneroLinha.Feminino => "Feminino",
            CategoriaLinha.Adulto => "Adulto",
            CategoriaLinha.Infantil => "Infantil",
            ProcessoProdutivoLinha.InjecaoDireta => "Injeção direta",
            ProcessoProdutivoLinha.Montado => "Montado",
            _ => valor.ToString()
        };
    }
}
