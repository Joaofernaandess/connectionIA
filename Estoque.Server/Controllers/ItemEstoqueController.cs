using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class ItemEstoqueController
{
    public record RequisicaoMovimentacao(decimal Quantidade, TipoMovimentacao TipoMovimentacao, Guid UsuarioId);
    public record RequisicaoTransferencia(Guid NovoEspacoId, Guid UsuarioId);

    public static void MapItemEstoqueEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/itens-estoque", async (ItemEstoqueService service, ItemEstoque item) =>
        {
            Guid itemEstoqueId = await service.Cadastrar(item);

            return TypedResults.CreatedAtRoute(
                routeName: "itens-estoque-get-by-id",
                routeValues: new { itemEstoqueId },
                value: "Item de estoque cadastrado com sucesso.");
        })
        .WithTags("itens-estoque")
        .WithSummary("Cadastra um novo item de estoque")
        .WithDescription("Cadastra um novo item no estoque.")
        .Produces(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ put ]
        app.MapPut("v1/itens-estoque/{itemEstoqueId:guid}", async (ItemEstoqueService service, Guid itemEstoqueId, ItemEstoqueAtualizado item) =>
        {
            await service.Atualizar(item, itemEstoqueId);

            return Results.Ok("Item de estoque atualizado com sucesso.");
        })
        .WithTags("itens-estoque")
        .WithSummary("Atualiza um registro de item do estoque")
        .WithDescription("Atualiza os dados um item de estoque existente.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ delete ]
        app.MapDelete("v1/itens-estoque/{itemEstoqueId:guid}", async (ItemEstoqueService service, Guid itemEstoqueId) =>
        {
            await service.Excluir(itemEstoqueId);

            return Results.Ok("Item de estoque excluído com sucesso.");
        })
        .WithTags("itens-estoque")
        .WithSummary("Exclui um item de estoque")
        .WithDescription("Exclui um item de estoque do banco de dados.")
        .Produces(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get ]
        app.MapGet("v1/itens-estoque", async (ItemEstoqueService service, int skip = 0, int top = 10, string? descricao = null, Guid? unidadeOrganizacionalId = null, Guid? espacoId = null) =>
        {
            var result = await service.Obter(skip, top, descricao, unidadeOrganizacionalId, espacoId);

            return Results.Ok(result);
        })
        .WithTags("itens-estoque")
        .WithSummary("Retorna lista de itens de estoque")
        .WithDescription("Retorna uma lista de itens de estoque com os parâmetros informados.")
        .Produces<List<ItemEstoqueRecuperado>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get by id ]
        app.MapGet("v1/itens-estoque/{itemEstoqueId:guid}", async (ItemEstoqueService service, Guid itemEstoqueId) =>
        {
            var result = await service.Obter(itemEstoqueId);

            return Results.Ok(result);
        })
        .WithName("itens-estoque-get-by-id")
        .WithTags("itens-estoque")
        .WithSummary("Retorna um item de estoque por ID")
        .WithDescription("Retorna um item de estoque específico por ID.")
        .Produces<ItemEstoqueRecuperado>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ patch - movimentação ]
        app.MapPatch("v1/itens-estoque/{itemEstoqueId:guid}", async (ItemEstoqueService service, Guid itemEstoqueId, RequisicaoMovimentacao req) =>
        {
            await service.Movimentar(itemEstoqueId, req.Quantidade, req.TipoMovimentacao, req.UsuarioId);

            return Results.Ok("Movimentação registrada e estoque atualizado com sucesso.");
        })
        .WithTags("itens-estoque")
        .WithSummary("Movimenta o estoque de um item")
        .WithDescription("Altera a quantidade de estoque de um item via PATCH, gerando histórico automático.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ patch - transferir ]
        app.MapPatch("v1/itens-estoque/{itemEstoqueId:guid}/transferir", async (ItemEstoqueService service, Guid itemEstoqueId, RequisicaoTransferencia req) =>
        {
            await service.Transferir(itemEstoqueId, req.NovoEspacoId, req.UsuarioId);

            return Results.Ok("Item transferido com sucesso para o novo espaço.");
        })
        .WithTags("itens-estoque")
        .WithSummary("Transfere um item para outro espaço")
        .WithDescription("Altera o espaço (localização) de um item de estoque existente.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get - histórico ]
        app.MapGet("v1/itens-estoque/{itemEstoqueId:guid}/historico", async (ItemEstoqueService service, Guid itemEstoqueId) =>
        {
            var result = await service.ObterHistorico(itemEstoqueId);

            return Results.Ok(result);
        })
        .WithTags("itens-estoque")
        .WithSummary("Retorna o histórico de movimentações do item")
        .WithDescription("Retorna todas as entradas e saídas que ocorreram para este item de estoque específico.")
        .Produces<List<HistoricoRecuperado>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion
    }
}