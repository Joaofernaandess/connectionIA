using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IAuditoriaRepository
{
    Task<List<AuditoriaHistoricoResponse>> ObterHistorico(AuditoriaHistoricoGetRequest request);
}