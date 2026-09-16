using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class ReferenciaProdutoController
{
    public static void MapReferenciaProdutoEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/referencias/", async (ReferenciaProdutoService service, ReferenciaProdutoPostRequest referenciaProduto) =>
        {
            var result = await service.Cadastrar(referenciaProduto);

            return Results.Created($"v1/referencias/{result.ReferenciaProdutoId}", result);
        })
       .WithTags("referencias")
       .WithSummary("Cadastra uma nova referência de produto")
       .WithDescription("Cadastra a próxima referência de produto para a linha informada.")
       .Produces<ReferenciaProdutoPostResponse>(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/referencias", async (ReferenciaProdutoService service, [AsParameters] ReferenciaProdutoGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("referencias")
       .WithSummary("Retorna lista de referências de produto")
       .WithDescription("Retorna uma lista de referências de produto de acordo com os parâmetros informados.")
       .Produces<List<ReferenciaProdutoGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get proxima ]
        app.MapGet("v1/referencias/proxima", async (ReferenciaProdutoService service, Guid linhaProdutoId) =>
        {
            var result = await service.ObterProxima(linhaProdutoId);

            return Results.Ok(result);
        })
       .WithTags("referencias")
       .WithSummary("Retorna a próxima referência de produto")
       .WithDescription("Retorna a próxima referência disponível para a linha informada.")
       .Produces<ReferenciaProdutoProximaResponse>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}
