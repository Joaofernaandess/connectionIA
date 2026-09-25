using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Reflection;

namespace Pedido.Infra.Services;

public class AuditoriaService : IAuditoriaService
{
    private readonly IAuditoriaQueue _queue;

    public AuditoriaService(IAuditoriaQueue queue)
    {
        _queue = queue;
    }

    public void RegistrarCadastro<T>(
        AuditoriaUsuario usuario,
        string entidade,
        Guid entidadeId,
        T novo)
    {
        Registrar("Cadastro", usuario, entidade, entidadeId, default(T), novo);
    }

    public void RegistrarAlteracao<T>(
        AuditoriaUsuario usuario,
        string entidade,
        Guid entidadeId,
        T anterior,
        T novo)
    {
        Registrar("Alteração", usuario, entidade, entidadeId, anterior, novo);
    }

    public void RegistrarEvento(
        AuditoriaUsuario usuario,
        string acao,
        string entidade,
        Guid entidadeId,
        string descricao)
    {
        var evento = new AuditoriaEvento
        {
            Acao = acao,
            Entidade = entidade,
            EntidadeId = entidadeId,
            Usuario = usuario,
            Descricao = descricao,
            Data = DateTimeHelper.SaoPaulo()
        };

        _queue.Enfileirar(evento);
    }

    private void Registrar<T>(
        string acao,
        AuditoriaUsuario usuario,
        string entidade,
        Guid entidadeId,
        T? anterior,
        T novo)
    {
        var alteracoes = acao == "Cadastro" && (EntidadeEhReferencia(entidade) || EntidadeEhLinha(entidade))
            ? []
            : AuditoriaComparador.Comparar(anterior, novo);

        if (acao == "Alteração" && !alteracoes.Any())
            return;

        var evento = new AuditoriaEvento
        {
            Acao = acao,
            Entidade = entidade,
            EntidadeId = entidadeId,
            Usuario = usuario,
            Alteracoes = alteracoes,
            Data = DateTimeHelper.SaoPaulo()
        };

        evento.Descricao = CriarDescricao(evento, novo);

        _queue.Enfileirar(evento);
    }

    private static string CriarDescricao<T>(AuditoriaEvento evento, T novo)
    {
        if (evento.Acao == "Cadastro" && EntidadeEhReferencia(evento.Entidade))
        {
            var codigoReferencia = ObterValorTexto(novo, "CodigoReferencia");

            return string.IsNullOrWhiteSpace(codigoReferencia)
                ? "Criou a referência."
                : $"Criou a referência {codigoReferencia}.";
        }

        if (evento.Acao == "Cadastro" && EntidadeEhLinha(evento.Entidade))
        {
            var numeroLinha = ObterValorTexto(novo, "NumeroLinha");

            return string.IsNullOrWhiteSpace(numeroLinha)
                ? "Criou a linha."
                : $"Criou a linha {numeroLinha}.";
        }

        return AuditoriaDescricaoBuilder.Criar(evento);
    }

    private static bool EntidadeEhReferencia(string entidade)
    {
        return string.Equals(entidade, "Referência", StringComparison.OrdinalIgnoreCase)
            || string.Equals(entidade, "Referencia", StringComparison.OrdinalIgnoreCase);
    }

    private static bool EntidadeEhLinha(string entidade)
    {
        return string.Equals(entidade, "Linha", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ObterValorTexto<T>(T origem, string propriedade)
    {
        return origem?.GetType()
            .GetProperty(propriedade, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
            ?.GetValue(origem)
            ?.ToString();
    }

}