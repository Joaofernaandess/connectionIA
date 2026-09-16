using Microsoft.AspNetCore.Diagnostics;
namespace Pedido.Server.Startup;

public static class ExceptionHandlerConfiguration
{
    public static WebApplication UseExceptionHandler(this WebApplication app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;

                if (exception is Pedido.Domain.Exceptions.ValidationException domainValidationException)
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(domainValidationException.Errors);
                    return;
                }

                if (exception is Pedido.Domain.Exceptions.NotFoundException domainNotFoundException)
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    await context.Response.WriteAsync(domainNotFoundException.Message);
                    return;
                }

                if (exception is InvalidOperationException invalidOperationException)
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsync(invalidOperationException.Message);
                    return;
                }

                if (exception is UnauthorizedAccessException unauthorizedAccessException)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync(unauthorizedAccessException.Message);
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsync(exception?.Message ?? "Erro não identificado.");
            });
        });
        return app;
    }
}