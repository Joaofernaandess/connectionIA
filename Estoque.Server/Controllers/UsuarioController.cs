using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class UsuarioController
{
    public static void MapUsuarioEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/usuarios/", async (UsuarioService service, Usuario usuario) =>
        {
            Guid usuarioId = await service.Cadastrar(usuario);

            return TypedResults.CreatedAtRoute(
                routeName: "usuario_get_by_id",
                routeValues: new { usuarioId },
                value: "Usuário cadastrado com sucesso. Aguarde a aprovação do Administrador.");
        })
       .WithTags("usuarios")
       .WithSummary("Cadastra um novo usuário")
       .WithDescription("Cadastra um novo usuário com perfil normal e não validado.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ put ]
        app.MapPut("v1/usuarios/{usuarioId:guid}", async (UsuarioService service, Guid usuarioId, UsuarioPutRequest usuario) =>
        {
            await service.Atualizar(usuario, usuarioId);

            return Results.Ok("Usuário atualizado com sucesso.");
        })
        .WithTags("usuarios")
        .WithSummary("Atualiza registro de usuário")
        .WithDescription("Atualiza os dados de um usuário existente.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ patch ]
        app.MapPatch("v1/usuarios/{usuarioId:guid}", async (UsuarioService service, Guid usuarioId) =>
        {
            await service.ValidarAcesso(usuarioId);

            return Results.Ok("Acesso do usuário validado com sucesso.");
        })
       .WithTags("usuarios")
       .WithSummary("Valida o acesso do usuário")
       .WithDescription("Valida o acesso do usuário no sistema.")
       .Produces(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ delete ]
        app.MapDelete("v1/usuarios/{usuarioId:guid}", async (UsuarioService service, Guid usuarioId) =>
        {
            await service.Excluir(usuarioId);

            return Results.NoContent();
        })
        .WithTags("usuarios")
        .WithSummary("Exclui um usuário")
        .WithDescription("Exclui um usuário do sistema.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ get ]
        app.MapGet("v1/usuarios", async (UsuarioService service, int skip = 0, int top = 10, string? username = null, Guid? unidadeOrganizacionalId = null, bool? valido = null) =>
        {
            var result = await service.Obter(skip, top, username, unidadeOrganizacionalId, valido);

            return Results.Ok(result);
        })
        .WithTags("usuarios")
        .WithSummary("Retorna lista de usuários")
        .WithDescription("Retorna uma lista de usuários de acordo com os parâmetros informados.")
        .Produces<List<UsuarioGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ get by id ]
        app.MapGet("v1/usuarios/{usuarioId:guid}", async (UsuarioService service, Guid usuarioId) =>
        {
            var result = await service.Obter(usuarioId);

            return Results.Ok(result);
        })
        .WithName("usuario_get_by_id")
        .WithTags("usuarios")
        .WithSummary("Retorna um usuário por ID")
        .WithDescription("Retorna um usuário específico por ID.")
        .Produces<UsuarioGetResponse>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion
    }
}