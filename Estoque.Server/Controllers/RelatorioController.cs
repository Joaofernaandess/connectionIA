using Estoque.Server.Models;
using Estoque.Server.Services;

namespace Estoque.Server.Controllers;

public class RelatorioController
{
    public static void MapRelatorioEndPoint(this WebApplication app)
    {

        #region [ get - relatório pizza ]
        app.MapGet("v1/relatorios/itens-estoque/pizza",
            async (ItemEstoqueService service,
                   Guid unidadeOrganizacionalId,
                   Guid? espacoId,
                   int? tipoUnidadeMedida) =>
            {
                var result = await service.ObterPizzaDashboard(
                    unidadeOrganizacionalId,
                    espacoId,
                    tipoUnidadeMedida
                );

                return Results.Ok(result);
            })
            .WithTags("relatorios")
            .WithSummary("Retorna dados agregados para o gráfico de pizza do estoque")
            .WithDescription("Retorna quantidades agregadas por espaço ou tipo de unidade para uso no dashboard.")
            .Produces<List<PizzaDashboardItem>>(StatusCodes.Status200OK)
            .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion
    }
}
