using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class PedidoItemController
{
    public static void MapPedidoItemEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/pedidos/{pedidoId:guid}/itens", async (PedidoItemService service, Guid pedidoId, PedidoItemPostRequest item) =>
        {
            Guid pedidoItemId = await service.Cadastrar(pedidoId, item);

            return Results.Created($"v1/pedidos/{pedidoId}/itens/{pedidoItemId}", "Item do pedido cadastrado com sucesso.");
        })
        .WithTags("pedidos-itens")
        .WithSummary("Cadastra um item do pedido")
        .WithDescription("Cadastra um novo item vinculado ao pedido informado.")
        .Produces(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/pedidos/{pedidoId:guid}/itens", async (PedidoItemService service, Guid pedidoId) =>
        {
            var result = await service.Obter(pedidoId);

            return Results.Ok(result);
        })
        .WithTags("pedidos-itens")
        .WithSummary("Retorna os itens do pedido")
        .WithDescription("Retorna todos os itens vinculados ao pedido informado.")
        .Produces<List<PedidoItemGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ delete ]
        app.MapDelete("v1/pedidos/{pedidoId:guid}/itens", async (PedidoItemService service, Guid pedidoId) =>
        {
            await service.Excluir(pedidoId);

            return Results.NoContent();
        })
        .WithTags("pedidos-itens")
        .WithSummary("Exclui os itens do pedido")
        .WithDescription("Exclui todos os itens vinculados ao pedido informado.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion
    }
}
