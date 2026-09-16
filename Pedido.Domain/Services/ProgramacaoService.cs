using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ProgramacaoService : BaseService
{
    private readonly IProgramacaoRepository _programacaoRepository;
    private readonly IAgendaRepository _agendaRepository;

    public ProgramacaoService(IProgramacaoRepository programacaoRepository, IAgendaRepository agendaRepository)
    {
        _programacaoRepository = programacaoRepository;
        _agendaRepository = agendaRepository;
    }

    public async Task<List<ProgramacaoResponse>> ObterPorAgenda(Guid agendaId)
    {
        try
        {
            return await _programacaoRepository.ObterPorAgenda(agendaId);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter programações da agenda: {ex.Message}");
        }
    }

    public async Task SalvarProgramacao(ProgramacaoRequest request)
    {
        try
        {
            var agendas = NormalizarAgendas(request);
            var pedidosIdsRemover = NormalizarPedidosIdsRemover(request);

            await ValidarProgramacao(agendas, pedidosIdsRemover);

            await _programacaoRepository.SalvarProgramacao(agendas, pedidosIdsRemover);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao salvar programação: {ex.Message}");
        }
    }

    public async Task ValidarProgramacoes(List<ProgramacaoItemRequest>? programacoes, bool util, List<Guid>? pedidosIgnoradosIds = null)
    {
        var programacoesNormalizadas = NormalizarProgramacoes(programacoes);

        if (!util && programacoesNormalizadas.Any())
            AddError(nameof(AgendaItem.Util), "Não é possível programar pedidos em dia não útil.");

        foreach (var programacao in programacoesNormalizadas)
        {
            if (programacao.PedidoId == Guid.Empty)
                AddError(nameof(ProgramacaoItemRequest.PedidoId), "Informe o pedido da programação.");

            if (programacao.Quantidade <= 0)
                AddError(nameof(ProgramacaoItemRequest.Quantidade), "A quantidade da programação deve ser maior que zero.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);

        await ValidarQuantidadeProgramada(programacoesNormalizadas, pedidosIgnoradosIds);
    }

    public static List<ProgramacaoItemRequest> NormalizarProgramacoes(List<ProgramacaoItemRequest>? programacoes)
    {
        return (programacoes ?? [])
            .GroupBy(programacao => programacao.PedidoId)
            .Select(grupo => new ProgramacaoItemRequest
            {
                PedidoId = grupo.Key,
                Quantidade = grupo.Sum(programacao => programacao.Quantidade)
            })
            .ToList();
    }

    private static List<ProgramacaoAgendaRequest> NormalizarAgendas(ProgramacaoRequest request)
    {
        return (request?.Agendas ?? [])
            .Where(agenda => agenda.AgendaId != Guid.Empty)
            .GroupBy(agenda => agenda.AgendaId)
            .Select(grupo => new ProgramacaoAgendaRequest
            {
                AgendaId = grupo.Key,
                QuantidadeDia = grupo.Sum(agenda => agenda.QuantidadeDia ?? 0),
                Programacoes = NormalizarProgramacoes(grupo.SelectMany(agenda => agenda.Programacoes).ToList())
            })
            .ToList();
    }

    private static List<Guid> NormalizarPedidosIdsRemover(ProgramacaoRequest request)
    {
        return (request?.PedidosIdsRemover ?? [])
            .Where(pedidoId => pedidoId != Guid.Empty)
            .Distinct()
            .ToList();
    }

    private async Task ValidarProgramacao(List<ProgramacaoAgendaRequest> agendas, List<Guid> pedidosIdsRemover)
    {
        if (!agendas.Any() && !pedidosIdsRemover.Any())
            AddError(nameof(ProgramacaoRequest.Agendas), "Informe ao menos uma agenda para programação.");

        foreach (var agenda in agendas)
        {
            var agendaAtual = await _agendaRepository.Obter(agenda.AgendaId);

            if (!agendaAtual.Any())
            {
                AddError(nameof(ProgramacaoAgendaRequest.AgendaId), "Agenda não encontrada com o ID informado.");
                continue;
            }

            if (!agendaAtual.First().Util && agenda.Programacoes.Any())
                AddError(nameof(AgendaItem.Util), "Não é possível programar pedidos em dia não útil.");

            if (!agenda.Programacoes.Any())
                AddError(nameof(ProgramacaoItemRequest.Quantidade), "Informe a quantidade de programação de todos os dias selecionados.");

            foreach (var programacao in agenda.Programacoes)
            {
                if (programacao.PedidoId == Guid.Empty)
                    AddError(nameof(ProgramacaoItemRequest.PedidoId), "Informe o pedido da programação.");

                if (programacao.Quantidade <= 0)
                    AddError(nameof(ProgramacaoItemRequest.Quantidade), "A quantidade da programação deve ser maior que zero.");
            }
        }

        if (Errors.Any())
            throw new ValidationException(Errors);

        var totalQuantidadeDia = agendas
            .Where(agenda => agenda.QuantidadeDia.HasValue)
            .Sum(agenda => agenda.QuantidadeDia!.Value);
        var programacoes = NormalizarProgramacoes(agendas.SelectMany(agenda => agenda.Programacoes).ToList());
        var totalProgramado = programacoes.Sum(programacao => programacao.Quantidade);

        if (totalQuantidadeDia > 0 && totalQuantidadeDia != totalProgramado)
            AddError(nameof(ProgramacaoAgendaRequest.QuantidadeDia), "A soma das quantidades dos dias selecionados deve fechar com o total de pares programados.");

        if (Errors.Any())
            throw new ValidationException(Errors);

        var pedidosIgnoradosIds = programacoes.Select(programacao => programacao.PedidoId).Distinct().ToList();
        await ValidarQuantidadeProgramada(programacoes, pedidosIgnoradosIds);
    }

    private async Task ValidarQuantidadeProgramada(List<ProgramacaoItemRequest> programacoes, List<Guid>? pedidosIgnoradosIds)
    {
        if (!programacoes.Any())
            return;

        var pedidosIds = programacoes
            .Select(programacao => programacao.PedidoId)
            .Distinct()
            .ToList();

        var pedidos = await _programacaoRepository.ObterResumoPedidos(pedidosIds, pedidosIgnoradosIds);
        var pedidosEncontradosIds = pedidos.Select(pedido => pedido.PedidoId).ToHashSet();

        foreach (var pedidoId in pedidosIds.Where(pedidoId => !pedidosEncontradosIds.Contains(pedidoId)))
            AddError(nameof(ProgramacaoItemRequest.PedidoId), $"Pedido {pedidoId} não encontrado.");

        foreach (var pedido in pedidos)
        {
            if (pedido.Status == PedidoStatus.AguardandoAnaliseIA)
            {
                var numeroPedido = string.IsNullOrWhiteSpace(pedido.NumeroPedido)
                    ? pedido.PedidoId.ToString()
                    : pedido.NumeroPedido;

                AddError(nameof(ProgramacaoItemRequest.PedidoId),
                    $"Pedido nº {numeroPedido} ainda está aguardando análise IA.");
                continue;
            }

            if (pedido.Status == PedidoStatus.AguardandoAnaliseGestor)
            {
                var numeroPedido = string.IsNullOrWhiteSpace(pedido.NumeroPedido)
                    ? pedido.PedidoId.ToString()
                    : pedido.NumeroPedido;

                AddError(nameof(ProgramacaoItemRequest.PedidoId),
                    $"Pedido nº {numeroPedido} ainda está aguardando análise do gestor.");
                continue;
            }

            if (pedido.Status == PedidoStatus.ReprovadoPeloGestor)
            {
                var numeroPedido = string.IsNullOrWhiteSpace(pedido.NumeroPedido)
                    ? pedido.PedidoId.ToString()
                    : pedido.NumeroPedido;

                AddError(nameof(ProgramacaoItemRequest.PedidoId),
                    $"Pedido nº {numeroPedido} foi reprovado pelo gestor.");
                continue;
            }

            var quantidadeSolicitada = programacoes
                .Where(programacao => programacao.PedidoId == pedido.PedidoId)
                .Sum(programacao => programacao.Quantidade);

            var quantidadeFinal = pedido.QuantidadeProgramada + quantidadeSolicitada;

            if (quantidadeFinal > pedido.TotalPares)
            {
                var numeroPedido = string.IsNullOrWhiteSpace(pedido.NumeroPedido)
                    ? pedido.PedidoId.ToString()
                    : pedido.NumeroPedido;

                AddError(nameof(ProgramacaoItemRequest.Quantidade),
                    $"Pedido nº {numeroPedido} possui {pedido.TotalPares} pares e ficaria com {quantidadeFinal} pares programados.");
            }
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}