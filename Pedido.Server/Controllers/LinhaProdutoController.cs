using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class LinhaProdutoController
{
    public static void MapLinhaProdutoEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/linhas-produto/", async (LinhaProdutoService service, LinhaProdutoPostRequest linhaProduto) =>
        {
            Guid linhaProdutoId = await service.Cadastrar(linhaProduto);

            return Results.Created($"v1/linhas-produto/{linhaProdutoId}", "Linha de produto cadastrada com sucesso.");
        })
       .WithTags("linhas produto")
       .WithSummary("Cadastra uma nova linha de produto")
       .WithDescription("Cadastra a linha utilizada no desenvolvimento para geração de referências.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/linhas-produto", async (LinhaProdutoService service, [AsParameters] LinhaProdutoGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("linhas produto")
       .WithSummary("Retorna lista de linhas de produto")
       .WithDescription("Retorna uma lista de linhas de produto de acordo com os parâmetros informados.")
       .Produces<List<LinhaProdutoGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get by id ]
        app.MapGet("v1/linhas-produto/{linhaProdutoId:guid}", async (LinhaProdutoService service, Guid linhaProdutoId) =>
        {
            var result = await service.Obter(linhaProdutoId);

            return Results.Ok(result);
        })
       .WithName("linha_produto_get_by_id")
       .WithTags("linhas produto")
       .WithSummary("Retorna uma linha de produto por ID")
       .WithDescription("Retorna uma linha de produto específica por ID.")
       .Produces<LinhaProduto>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/linhas-produto/{linhaProdutoId:guid}", async (LinhaProdutoService service, Guid linhaProdutoId, LinhaProdutoPutRequest linhaProduto) =>
        {
            await service.Atualizar(linhaProdutoId, linhaProduto);

            return Results.Ok("Linha de produto atualizada com sucesso.");
        })
       .WithTags("linhas produto")
       .WithSummary("Atualiza uma linha de produto")
       .WithDescription("Atualiza os dados principais de uma linha de produto.")
       .Produces(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}
