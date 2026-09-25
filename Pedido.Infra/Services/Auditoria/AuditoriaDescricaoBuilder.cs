using Pedido.Domain.Models;

namespace Pedido.Infra.Services;

public static class AuditoriaDescricaoBuilder
{
    public static string Criar(AuditoriaEvento evento)
    {
        if (!evento.Alteracoes.Any())
            return $"Gravou {evento.Entidade}.";

        var trechos = evento.Alteracoes
            .Select(alteracao => CriarTrecho(alteracao))
            .ToList();

        return $"{Capitalizar(string.Join(", ", trechos))}.";
    }

    private static string CriarTrecho(AuditoriaAlteracao alteracao)
    {
        if (string.IsNullOrWhiteSpace(alteracao.ValorAnterior))
            return $"informou {alteracao.CampoDescricao} como {alteracao.ValorNovo}";

        if (string.IsNullOrWhiteSpace(alteracao.ValorNovo))
            return $"removeu {alteracao.CampoDescricao} {alteracao.ValorAnterior}";

        return $"alterou {alteracao.CampoDescricao} de {alteracao.ValorAnterior} para {alteracao.ValorNovo}";
    }

    private static string Capitalizar(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return texto;

        return char.ToUpperInvariant(texto[0]) + texto[1..];
    }
}