using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IRelatorioPdfService
{
    byte[] GerarRelatorio(RelatorioFiltroRequest filtro, List<RelatorioDiaResponse> dados);
}