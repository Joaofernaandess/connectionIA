using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class UnidadeOrganizacionalController
{
    public static void MapUnidadeOrganizacionalEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/unidades-organizacionais/", async (UnidadeOrganizacionalService service, PayloadCryptoService cryptoService, EncryptedRequest request) =>
        {
            var unidadeOrganizacional = cryptoService.Descriptografar<UnidadeOrganizacional>(request);
            Guid unidadeOrganizacionalId = await service.Cadastrar(unidadeOrganizacional);

            return TypedResults.CreatedAtRoute(
                routeName: "unidades-organizacionais-get-by-id",
                routeValues: new { unidadeOrganizacionalId },
                value: "Unidade organizacional cadastrada com sucesso.");
        })
        .WithTags("unidades-organizacionais")
        .WithSummary("Cadastra uma nova unidade organizacional")
        .WithDescription("Cadastra uma nova unidade organizacional.")
        .Produces(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ put ]
        app.MapPut("v1/unidades-organizacionais/{unidadeOrganizacionalId:Guid}", async (UnidadeOrganizacionalService service, PayloadCryptoService cryptoService, Guid unidadeOrganizacionalId, EncryptedRequest request) =>
        {
            var unidadeOrganizacional = cryptoService.Descriptografar<UnidadeOrganizacional>(request);
            await service.Atualizar(unidadeOrganizacional, unidadeOrganizacionalId);

            return Results.Ok("Unidade organizacional atualizada com sucesso.");
        })
        .WithTags("unidades-organizacionais")
        .WithSummary("Atualiza um registro de unidade organizacional")
        .WithDescription("Atualiza os dados de uma unidade organizacional existente.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ delete ]
        app.MapDelete("v1/unidades-organizacionais/{unidadeOrganizacionalId:Guid}", async (UnidadeOrganizacionalService service, Guid unidadeOrganizacionalId) =>
        {
            await service.Excluir(unidadeOrganizacionalId);

            return Results.NoContent();
        })
        .WithTags("unidades-organizacionais")
        .WithSummary("Exclui uma unidade")
        .WithDescription("Exclui uma unidade organizacional do banco de dados.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ get ]
        app.MapGet("v1/unidades-organizacionais", async (UnidadeOrganizacionalService service, int skip = 0, int top = 10, string? razaoSocial = null, string? cnpj = null) =>
        {
            var result = await service.Obter(skip, top, razaoSocial, cnpj);

            return Results.Ok(result);
        })
        .WithTags("unidades-organizacionais")
        .WithSummary("Retorna uma lista de unidades organizacionais")
        .WithDescription("Retorna uma lista de unidades organizacionais de acordo com os parâmetros informados.")
        .Produces<List<UnidadeOrganizacionalGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get by id ]
        app.MapGet("v1/unidades-organizacionais/{unidadeOrganizacionalId:Guid}", async (UnidadeOrganizacionalService service, Guid unidadeOrganizacionalId) =>
        {
            var result = await service.Obter(unidadeOrganizacionalId);

            return Results.Ok(result);
        })
        .WithName("unidades-organizacionais-get-by-id")
        .WithTags("unidades-organizacionais")
        .WithSummary("Retorna uma unidade organizacional por ID")
        .WithDescription("Retorna uma unidade organizacional específica por ID.")
        .Produces<UnidadeOrganizacionalGetResponse>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion
    }
}