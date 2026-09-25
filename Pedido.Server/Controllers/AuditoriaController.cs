using Pedido.Domain.Models;
using Pedido.Domain.Services;

namespace Pedido.Server.Controllers;

public static class AuditoriaController
{
    public static void MapAuditoriaEndpoints(this WebApplication app)
    {
        app.MapGet("v1/auditorias/historico", async (
            AuditoriaHistoricoService service,
            [AsParameters] AuditoriaHistoricoGetRequest request) =>
        {
            var result = await service.ObterHistorico(request);

            return Results.Ok(result);
        })
       .WithTags("auditorias")
       .WithSummary("Retorna histórico de auditoria")
       .WithDescription("Retorna o histórico salvo nos logs de auditoria para a referência ou linha informada.")
       .Produces<List<AuditoriaHistoricoResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
    }
}
