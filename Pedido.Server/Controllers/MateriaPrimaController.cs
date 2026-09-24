using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class MateriaPrimaController
{
    public static void MapMateriaPrimaEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/materias-primas/", async (MateriaPrimaService service, MateriaPrimaPostRequest materiaPrima) =>
        {
            var result = await service.Cadastrar(materiaPrima);

            return Results.Created($"v1/materias-primas/{result.MateriaPrimaId}", result);
        })
       .WithTags("materias-primas")
       .WithSummary("Cadastra uma nova matéria-prima")
       .WithDescription("Cadastra matéria-prima para uso nos comboboxes de desenvolvimento.")
       .Produces<MateriaPrimaPostResponse>(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/materias-primas", async (MateriaPrimaService service, [AsParameters] MateriaPrimaGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("materias-primas")
       .WithSummary("Retorna lista de matérias-primas")
       .WithDescription("Retorna uma lista de matérias-primas de acordo com os parâmetros informados.")
       .Produces<List<MateriaPrimaGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}