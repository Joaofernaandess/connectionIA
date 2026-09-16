using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IAgendaRepository
{
    Task Cadastrar(List<AgendaItem> agendaItems);
    Task<int> Atualizar(Guid agendaId, DateTime data, bool util, string motivo);
    Task<List<AgendaResponse>> ObterAgenda();
    Task<List<AgendaResponse>> Obter(Guid agendaId);
}