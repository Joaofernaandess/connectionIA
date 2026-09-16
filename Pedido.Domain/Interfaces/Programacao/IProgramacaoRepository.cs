using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IProgramacaoRepository
{
    Task<List<ProgramacaoResponse>> ObterPorAgenda(Guid agendaId);
    Task<List<PedidoProgramacaoResumo>> ObterResumoPedidos(List<Guid> pedidosIds, List<Guid>? pedidosIgnoradosIds = null);
    Task SalvarProgramacao(List<ProgramacaoAgendaRequest> agendas, List<Guid> pedidosIdsRemover);
}