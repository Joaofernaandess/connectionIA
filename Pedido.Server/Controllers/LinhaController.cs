using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;
using Pedido.Server.AuthServices;

namespace Pedido.Server.Controllers;

public static class LinhaController
{
    public static void MapLinhaEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/linhas/", async (LinhaService service, HttpContext context, LinhaPostRequest linha) =>
        {
            Guid linhaId = await service.Cadastrar(linha, context.ObterUsuarioAuditoria());

            return Results.Created($"v1/linhas/{linhaId}", "Linha cadastrada com sucesso.");
        })
       .WithTags("linhas")
       .WithSummary("Cadastra uma nova linha")
       .WithDescription("Cadastra a linha utilizada no desenvolvimento para geração de referências.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/linhas", async (LinhaService service, [AsParameters] LinhaGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("linhas")
       .WithSummary("Retorna lista de linhas")
       .WithDescription("Retorna uma lista de linhas de acordo com os parâmetros informados.")
       .Produces<List<LinhaGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get by id ]
        app.MapGet("v1/linhas/{linhaId:guid}", async (LinhaService service, Guid linhaId) =>
        {
            var result = await service.Obter(linhaId);

            return Results.Ok(result);
        })
       .WithName("linha_get_by_id")
       .WithTags("linhas")
       .WithSummary("Retorna uma linha por ID")
       .WithDescription("Retorna uma linha específica por ID.")
       .Produces<Linha>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/linhas/{linhaId:guid}", async (LinhaService service, HttpContext context, Guid linhaId, LinhaPutRequest linha) =>
        {
            await service.Atualizar(linhaId, linha, context.ObterUsuarioAuditoria());

            return Results.Ok("Linha atualizada com sucesso.");
        })
       .WithTags("linhas")
       .WithSummary("Atualiza uma linha")
       .WithDescription("Atualiza os dados principais de uma linha.")
       .Produces(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}