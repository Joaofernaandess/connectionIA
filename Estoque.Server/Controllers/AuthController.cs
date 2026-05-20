using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class AuthController
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/auth/login", async (AuthService service, Auth auth) =>
        {
            var response = await service.Login(auth);

            return Results.Ok(response);
        })
        .WithTags("auth")
        .WithSummary("Autentica um usuário")
        .WithDescription("Realiza o login e gera um Token JWT informando o username e a senha.")
        .Produces<AuthToken>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status401Unauthorized)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .AllowAnonymous();
        #endregion

        #region [ forgot ]
        app.MapPost("v1/auth/forgot", async (AuthService service, AuthForgot request) =>
        {
            await service.EsquecerSenha(request);

            return Results.Ok("Se as informações estiverem corretas, você receberá um código de recuperação.");
        })
        .WithTags("auth")
        .WithSummary("Solicita recuperação de acesso")
        .WithDescription("Inicia o processo de recuperação de conta informando o username.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .AllowAnonymous();
        #endregion

        #region [ verify ]
        app.MapPost("v1/auth/verify", async (AuthService service, AuthVerify request) =>
        {
            string codigoResetId = await service.VerificarCodigo(request);

            return Results.Ok(new
            {
                codigoResetId = codigoResetId
            });
        })
        .WithTags("auth")
        .WithSummary("Verifica o código SMS")
        .WithDescription("Valida o código de 6 dígitos e retorna o CodigoResetId para redefinição.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .AllowAnonymous();
        #endregion

        #region [ reset ]
        app.MapPost("v1/auth/reset", async (AuthService service, AuthReset request) =>
        {
            await service.RedefinirSenha(request);

            return Results.Ok("Senha redefinida com sucesso.");
        })
        .WithTags("auth")
        .WithSummary("Redefine a senha do usuário")
        .WithDescription("Altera a senha utilizando o CodigoAcessoId e a nova senha.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .AllowAnonymous();
        #endregion
    }
}