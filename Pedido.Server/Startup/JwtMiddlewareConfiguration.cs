using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace Pedido.Server.Startup;

public static class JwtMiddlewareConfiguration
{
    public static IServiceCollection AddJwtConfiguration(
        this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        services.AddAuthorization();
        return services;
    }

    public static WebApplication UseJwtValidation(
        this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            var path = context.Request.Path;

            if (EhRotaPublica(context, path))
            {
                await next();
                return;
            }

            var authHeader = context.Request.Headers.Authorization
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(authHeader) ||
                !authHeader.StartsWith(
                    "Bearer ",
                    StringComparison.OrdinalIgnoreCase))
            {
                await RetornarNaoAutorizado(
                    context,
                    "Não autorizado.");

                return;
            }

            var token = authHeader["Bearer ".Length..].Trim();

            try
            {
                ValidarToken(context, token);
            }
            catch (SecurityTokenExpiredException)
            {
                await RetornarNaoAutorizado(
                    context,
                    "Não autorizado. Token expirado.");

                return;
            }
            catch (SecurityTokenException)
            {
                await RetornarNaoAutorizado(
                    context,
                    "Não autorizado. Token inválido.");

                return;
            }
            catch (ArgumentException)
            {
                await RetornarNaoAutorizado(
                    context,
                    "Não autorizado. Token inválido.");

                return;
            }

            await next();

            if (context.Response.StatusCode ==
                    StatusCodes.Status403Forbidden &&
                !context.Response.HasStarted)
            {
                await context.Response.WriteAsync(
                    "Acesso negado.");
            }
        });

        app.UseAuthorization();

        return app;
    }

    private static bool EhRotaPublica(
        HttpContext context,
        PathString path)
    {
        var method = context.Request.Method;

        var cadastroUsuario =
            path.StartsWithSegments("/v1/usuarios") &&
            HttpMethods.IsPost(method);

        var rotaAnaliseIa =
            path.StartsWithSegments("/v1/pedidos") &&
            HttpMethods.IsPut(method) &&
            path.Value?.EndsWith(
                "/analise-ia",
                StringComparison.OrdinalIgnoreCase) == true;

        var rotaVisualizarArquivoPedido =
            path.StartsWithSegments("/v1/pedidos") &&
            HttpMethods.IsGet(method) &&
            path.Value?.EndsWith(
                "/arquivo/visualizar",
                StringComparison.OrdinalIgnoreCase) == true;

        var rotaPromptsClienteAnaliseIa =
            path.StartsWithSegments("/v1/clientes/prompts") &&
            HttpMethods.IsGet(method);

        return
            path.StartsWithSegments("/v1/auth") ||
            cadastroUsuario ||
            rotaAnaliseIa ||
            rotaVisualizarArquivoPedido ||
            rotaPromptsClienteAnaliseIa ||
            path.StartsWithSegments("/hubs/pedidos") ||
            path.StartsWithSegments("/swagger") ||
            path.StartsWithSegments("/openapi") ||
            path.StartsWithSegments("/health");
    }

    private static void ValidarToken(
        HttpContext context,
        string token)
    {
        var jwtSecret = Environment.GetEnvironmentVariable(
            "zenite_jwt_auth");

        if (string.IsNullOrWhiteSpace(jwtSecret))
        {
            throw new InvalidOperationException(
                "A variável de ambiente zenite_jwt_auth " +
                "não foi encontrada ou configurada.");
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(jwtSecret);

        var principal = tokenHandler.ValidateToken(
            token,
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            },
            out _);

        context.User = principal;
    }

    private static async Task RetornarNaoAutorizado(
        HttpContext context,
        string mensagem)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.StatusCode =
            StatusCodes.Status401Unauthorized;

        await context.Response.WriteAsync(mensagem);
    }
}
