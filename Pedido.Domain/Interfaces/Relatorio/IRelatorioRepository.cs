using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IRelatorioRepository
{
    Task<List<RelatorioDiaResponse>> ObterRelatorioPares(RelatorioFiltroRequest filtro);
}