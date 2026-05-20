using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class EspacoController
{
    public static void MapEspacoEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/espacos/", async (EspacoService service, Espaco espaco) =>
        {
            Guid espacoId = await service.Cadastrar(espaco);

            return TypedResults.CreatedAtRoute(
                routeName: "espacos-get-by-id",
                routeValues: new { espacoId },
                value: "Espaço cadastrado com sucesso.");
        })
        .WithTags("espacos")
        .WithSummary("Cadastra um novo espaço")
        .WithDescription("Cadastra um novo espaço.")
        .Produces(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ put ]
        app.MapPut("v1/espacos/{espacoId:Guid}", async (EspacoService service, Guid espacoId, Espaco espaco) =>
        {
            await service.Atualizar(espaco, espacoId);

            return Results.Ok("Espaço atualizado com sucesso.");
        })
        .WithTags("espacos")
        .WithSummary("Atualiza um registro de espaço")
        .WithDescription("Atualiza os dados de um espaço existente.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ delete ]
        app.MapDelete("v1/espacos/{espacoId:Guid}", async (EspacoService service, Guid espacoId) =>
        {
            await service.Excluir(espacoId);

            return Results.NoContent();
        })
        .WithTags("espacos")
        .WithSummary("Exclui um espaço")
        .WithDescription("Exclui um espaço do banco de dados.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get ]
        app.MapGet("v1/espacos", async (EspacoService service, int skip = 0, int top = 10, string? nome = null, Guid? unidadeOrganizacionalId = null) =>
        {
            var result = await service.Obter(skip, top, nome, unidadeOrganizacionalId);

            return Results.Ok(result);
        })
        .WithTags("espacos")
        .WithSummary("Retorna uma lista de espaços")
        .WithDescription("Retorna uma lista de espaços de acordo com os parâmetros informados.")
        .Produces<List<EspacoGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get by id ]
        app.MapGet("v1/espacos/{espacoId:Guid}", async (EspacoService service, Guid espacoId) =>
        {
            var result = await service.Obter(espacoId);

            return Results.Ok(result);
        })
        .WithName("espacos-get-by-id")
        .WithTags("espacos")
        .WithSummary("Retorna um espaço por ID")
        .WithDescription("Retorna um espaço específico por ID.")
        .Produces<EspacoGetResponse>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion
    }
}