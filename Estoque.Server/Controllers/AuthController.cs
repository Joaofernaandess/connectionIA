using Estoque.Server.Models;
using Estoque.Server.Services;
using Estoque.Server.Validations;

namespace Estoque.Server.Controllers;

public static class AuthController
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/auth/login", async (AuthService service, PayloadCryptoService cryptoService, EncryptedRequest request) =>
        {
            var auth = cryptoService.Descriptografar<Auth>(request);
            var response = await service.Login(auth);

            return Results.Ok(response);
        })
        .WithTags("auth")
        .WithSummary("Autentica um usuário")
        .WithDescription("Realiza o login e gera um Token JWT informando o username e a senha.")
        .Produces<AuthLoginResponse>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status401Unauthorized)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .AllowAnonymous();
        #endregion

        #region [ forgot ]
        app.MapPost("v1/auth/forgot", async (AuthService service, PayloadCryptoService cryptoService, EncryptedRequest encryptedRequest) =>
        {
            var request = cryptoService.Descriptografar<AuthForgot>(encryptedRequest);
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

        #region [ registration-code ]
        app.MapPost("v1/auth/registration-code", async (AuthService service, PayloadCryptoService cryptoService, EncryptedRequest encryptedRequest) =>
        {
            var request = cryptoService.Descriptografar<AuthForgot>(encryptedRequest);
            await service.ReenviarCodigoCadastro(request);

            return Results.Ok("Código reenviado com sucesso.");
        })
        .WithTags("auth")
        .WithSummary("Reenvia código de validação de cadastro")
        .WithDescription("Reenvia o código de 6 dígitos para cadastros que ainda estão em validação.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .AllowAnonymous();
        #endregion

        #region [ verify ]
        app.MapPost("v1/auth/verify", async (AuthService service, PayloadCryptoService cryptoService, EncryptedRequest encryptedRequest) =>
        {
            var request = cryptoService.Descriptografar<AuthVerify>(encryptedRequest);
            var response = await service.VerificarCodigo(request);

            return Results.Ok(cryptoService.CriptografarResposta(encryptedRequest, response));
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
        app.MapPost("v1/auth/reset", async (AuthService service, PayloadCryptoService cryptoService, EncryptedRequest encryptedRequest) =>
        {
            var request = cryptoService.Descriptografar<AuthReset>(encryptedRequest);
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
