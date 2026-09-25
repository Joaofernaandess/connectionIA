using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class AuditoriaHistoricoService
{
    private readonly IAuditoriaRepository _auditoriaRepository;

    public AuditoriaHistoricoService(IAuditoriaRepository auditoriaRepository)
    {
        _auditoriaRepository = auditoriaRepository;
    }

    public async Task<List<AuditoriaHistoricoResponse>> ObterHistorico(AuditoriaHistoricoGetRequest request)
    {
        try
        {
            return await _auditoriaRepository.ObterHistorico(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter histórico de auditoria: {ex.Message}");
        }
    }
}