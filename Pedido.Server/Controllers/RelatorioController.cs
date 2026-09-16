using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class RelatorioController
{
    public static void MapRelatorioEndpoints(this IEndpointRouteBuilder app)
    {
        #region [ post ]
        app.MapPost("v1/relatorios/", async (RelatorioFiltroRequest request, RelatorioService service) =>
        {
            var dados = await service.GerarRelatorio(request);

            return Results.Ok(dados);
        })
        .WithTags("relatorio")
        .WithSummary("Gera relatório")
        .WithDescription("Retorna o relatório agrupado conforme os filtros informados.")
        .Produces<List<RelatorioDiaResponse>>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post pdf ]
        app.MapPost("v1/relatorios/pdf", async (RelatorioFiltroRequest request, RelatorioService service) =>
        {
            var pdf = await service.GerarRelatorioPdf(request);
            var fileName = $"relatorio-pedidos-{DateTime.Now:yyyyMMddHHmmss}.pdf";

            return Results.File(pdf, "application/pdf", fileName);
        })
        .WithTags("relatorio")
        .WithSummary("Gera PDF do relatório")
        .WithDescription("Retorna um PDF simples, em preto e branco, conforme os filtros informados.")
        .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion
    }
}
