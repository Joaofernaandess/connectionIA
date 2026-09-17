using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class CorController
{
    public static void MapCorEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/cores/", async (CorService service, CorPostRequest cor) =>
        {
            var result = await service.Cadastrar(cor);

            return Results.Created($"v1/cores/{result.CorId}", result);
        })
       .WithTags("cores")
       .WithSummary("Cadastra uma nova cor")
       .WithDescription("Cadastra a cor utilizada no desenvolvimento de referências.")
       .Produces<CorPostResponse>(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/cores", async (CorService service, [AsParameters] CorGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("cores")
       .WithSummary("Retorna lista de cores")
       .WithDescription("Retorna uma lista de cores de acordo com os parâmetros informados.")
       .Produces<List<CorGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}
