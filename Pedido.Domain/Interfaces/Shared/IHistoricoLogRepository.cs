using Pedido.Domain.Models.Shared;

namespace Pedido.Domain.Interfaces.Shared
{
    public interface IHistoricoLogRepository
    {
        Task GravarLogAsync(HistoricoLog log);

        Task GravarLogsEmLoteAsync(IEnumerable<HistoricoLog> logs);

        Task<IEnumerable<HistoricoLog>> ObterHistoricoPorEntidadeAsync(Guid entidadeId);
    }
}