using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class UsuarioController
{
    public static void MapUsuarioEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/usuarios/", async (UsuarioService service, PayloadCryptoService cryptoService, EncryptedRequest request) =>
        {
            var usuario = cryptoService.Descriptografar<Usuario>(request);
            Guid usuarioId = await service.Cadastrar(usuario);

            return TypedResults.CreatedAtRoute(
                routeName: "usuario_get_by_id",
                routeValues: new { usuarioId },
                value: "Usuário cadastrado com sucesso. Informe o código enviado para validar o cadastro.");
        })
       .WithTags("usuarios")
       .WithSummary("Cadastra um novo usuário")
       .WithDescription("Cadastra um novo usuário com perfil normal e não validado.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ patch ]
        app.MapPatch("v1/usuarios/{usuarioId:guid}/nome", async (UsuarioService service, PayloadCryptoService cryptoService, Guid usuarioId, EncryptedRequest request) =>
        {
            var usuario = cryptoService.Descriptografar<UsuarioPatchRequest>(request);
            await service.AtualizarNome(usuario, usuarioId);

            return Results.Ok("Nome atualizado com sucesso.");
        })
        .WithTags("usuarios")
        .WithSummary("Atualiza o nome do usuário")
        .WithDescription("Atualiza apenas o nome de um usuário existente.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();

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

        #region [ get ]
        app.MapGet("v1/usuarios", async (UsuarioService service, int skip = 0, int top = 10, string? username = null, Guid? unidadeOrganizacionalId = null, bool? cadastroCompleto = null) =>
        {
            var result = await service.Obter(skip, top, username, unidadeOrganizacionalId, cadastroCompleto);

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