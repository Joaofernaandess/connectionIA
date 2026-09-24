using System.Threading.RateLimiting;

namespace Pedido.Server.Startup;

public static class RateLimiterConfiguration
{
    public static IServiceCollection AddRateLimiterConfiguration(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();

                await context.HttpContext.Response.WriteAsync("Muitas tentativas. Tente novamente mais tarde.", cancellationToken);
            };

            options.AddPolicy("login-policy", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ObterChaveRateLimitPorRota(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(10),
                        QueueLimit = 0
                    }));
        });
        return services;
    }


    static string ObterIpCliente(HttpContext httpContext)
    {
        var cloudflareIp = httpContext.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(cloudflareIp))
            return cloudflareIp.Trim();

        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
            return realIp.Trim();

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "ip-nao-identificado";
    }

    static string ObterChaveRateLimitPorRota(HttpContext httpContext)
    {
        var rota = httpContext.GetEndpoint() is RouteEndpoint routeEndpoint
            ? routeEndpoint.RoutePattern.RawText
            : httpContext.Request.Path.Value;

        return $"{ObterIpCliente(httpContext)}:{httpContext.Request.Method}:{rota ?? "rota-nao-identificada"}";
    }
}

