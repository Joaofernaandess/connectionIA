using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;
using System.Security.Claims;

namespace Pedido.Server.Controllers;

public static class PedidoController
{
    public static void MapPedidoEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/pedidos/", async (HttpContext context, PedidoService service, PedidoPostRequest pedido) =>
        {
            var usuarioIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(usuarioIdClaim, out var usuarioId))
                return Results.Unauthorized();

            Guid pedidoId = await service.Cadastrar(pedido, usuarioId);

            return Results.Created($"v1/pedidos/{pedidoId}", "Pedido cadastrado com sucesso.");
        })
        .WithTags("pedidos")
        .WithSummary("Cadastra um novo pedido")
        .WithDescription("Cadastra os dados principais de um pedido, sem itens.")
        .Produces(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/pedidos", async (PedidoService service, [AsParameters] PedidoGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
        .WithTags("pedidos")
        .WithSummary("Retorna lista de pedidos")
        .WithDescription("Retorna uma lista de pedidos sem itens.")
        .Produces<List<PedidoGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get by id ]
        app.MapGet("v1/pedidos/{pedidoId:guid}", async (PedidoService service, Guid pedidoId) =>
        {
            var result = await service.Obter(pedidoId);

            return Results.Ok(result);
        })
        .WithName("pedido_get_by_id")
        .WithTags("pedidos")
        .WithSummary("Retorna um pedido por ID")
        .WithDescription("Retorna os dados principais de um pedido com os itens vinculados.")
        .Produces<PedidoGetByIdResponse>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post arquivo token ]
        app.MapPost("v1/pedidos/{pedidoId:guid}/arquivo/token", async (PedidoArquivoService service, Guid pedidoId) =>
        {
            var result = await service.GerarTokenArquivo(pedidoId);

            return Results.Ok(result);
        })
        .WithTags("pedidos")
        .WithSummary("Gera token temporário do arquivo do pedido")
        .WithDescription("Gera uma rota temporária para visualizar o arquivo do pedido sem expor a URL do bucket.")
        .Produces<PedidoArquivoTokenResponse>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get arquivo visualizar ]
        app.MapGet("v1/pedidos/{pedidoId:guid}/arquivo/visualizar", async (HttpContext context, PedidoArquivoService service, Guid pedidoId, string? token) =>
        {
            var cookieName = MontarArquivoTokenCookieName(pedidoId);

            if (!string.IsNullOrWhiteSpace(token))
            {
                service.ValidarTokenArquivo(pedidoId, token);

                context.Response.Cookies.Append(cookieName, token, new CookieOptions
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.Lax,
                    Secure = context.Request.IsHttps,
                    MaxAge = TimeSpan.FromSeconds(60),
                    Path = context.Request.Path
                });

                return Results.Redirect($"/v1/pedidos/{pedidoId}/arquivo/visualizar");
            }

            token = context.Request.Cookies[cookieName];

            var result = await service.ObterArquivo(pedidoId, token ?? string.Empty);
            var nomeArquivo = result.NomeArquivo.Replace("\"", string.Empty);

            context.Response.Headers["Content-Disposition"] = $"inline; filename=\"{nomeArquivo}\"";

            return Results.File(result.Arquivo, result.ContentType, enableRangeProcessing: true);
        })
        .WithTags("pedidos")
        .WithSummary("Visualiza arquivo do pedido")
        .WithDescription("Retorna o arquivo do pedido usando token temporário.")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ put ]
        app.MapPut("v1/pedidos/{pedidoId:guid}", async (PedidoService service, Guid pedidoId, PedidoPutRequest pedido) =>
        {
            await service.Atualizar(pedidoId, pedido);

            return Results.Ok("Pedido atualizado com sucesso.");
        })
        .WithTags("pedidos")
        .WithSummary("Atualiza pedido após OCR")
        .WithDescription("Atualiza os campos principais do pedido após processamento OCR, sem itens.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get notas avaliacao analise ia ]
        app.MapGet("v1/pedidos/analise-ia/avaliacao/notas", (PedidoService service) =>
        {
            var result = service.ObterNotasAvaliacaoGestor();

            return Results.Ok(result);
        })
        .WithTags("pedidos")
        .WithSummary("Retorna notas de avaliação da análise IA")
        .WithDescription("Retorna as notas disponíveis para avaliação do gestor a partir do enum do backend.")
        .Produces<List<PedidoAvaliacaoNotaGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post avaliacao analise ia ]
        app.MapPost("v1/pedidos/{pedidoId:guid}/analise-ia/avaliacao", async (PedidoService service, Guid pedidoId, PedidoAvaliacaoGestorPostRequest avaliacao) =>
        {
            var pedidoAvaliacaoGestorId = await service.SalvarAvaliacaoGestor(pedidoId, avaliacao);

            return Results.Created(
                $"v1/pedidos/{pedidoId}/analise-ia/avaliacao/{pedidoAvaliacaoGestorId}",
                "Avaliação do gestor registrada com sucesso.");
        })
        .WithTags("pedidos")
        .WithSummary("Salva avaliação da análise IA do pedido")
        .WithDescription("Salva a nota de 1 a 5 e os dados de avaliação da análise IA vinculados ao pedido.")
        .Produces(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ put prompt avaliacao analise ia ]
        app.MapPut("v1/pedidos/{pedidoId:guid}/analise-ia/avaliacao/{pedidoAvaliacaoGestorId:guid}/prompt", async (
            PedidoService service,
            Guid pedidoId,
            Guid pedidoAvaliacaoGestorId,
            PedidoAvaliacaoGestorPromptPutRequest request) =>
        {
            await service.AtualizarPromptAvaliacaoGestor(pedidoId, pedidoAvaliacaoGestorId, request);

            return Results.Ok("Prompt atualizado com sucesso.");
        })
        .WithTags("pedidos")
        .WithSummary("Atualiza prompt da avaliação da análise IA")
        .WithDescription("Atualiza somente o prompt da avaliação da análise IA vinculada ao pedido.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization(policy => policy.RequireRole("Admin"));
        #endregion

        #region [ put analise ia ]
        app.MapPut("v1/pedidos/{pedidoId:guid}/analise-ia", async (HttpContext context, PedidoAgenteIAService service, Guid pedidoId, PedidoAnaliseIAResponse analise) =>
        {
            var webhookToken = Environment.GetEnvironmentVariable("PEDIDO_ANALISE_IA_WEBHOOK_TOKEN")?.Trim();

            if (!string.IsNullOrWhiteSpace(webhookToken))
            {
                if (analise.WebhookToken?.Trim() != webhookToken)
                    return Results.Unauthorized();
            }

            await service.AtualizarPedidoComAnaliseIA(pedidoId, analise);

            return Results.Ok("Pedido atualizado com análise IA.");
        })
        .WithTags("pedidos")
        .WithSummary("Atualiza pedido com análise IA")
        .WithDescription("Recebe o resultado do agente de IA, atualiza os dados principais do pedido e substitui os itens.")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ upload ]
        app.MapPost("v1/pedidos/upload", async (HttpContext context, IPedidoUploadService service, PedidoUploadRequest request) =>
        {
            var usuarioIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(usuarioIdClaim, out var usuarioId))
                return Results.Unauthorized();

            var response = await service.Upload(request, usuarioId);

            return Results.Created($"v1/pedidos/{response.PedidoId}", response);
        })
        .WithTags("pedidos")
        .WithSummary("Envia arquivo de pedido")
        .WithDescription("Envia o arquivo em base64 para o storage configurado e cadastra o pedido com o link retornado.")
        .Accepts<PedidoUploadRequest>("application/json")
        .Produces<PedidoUploadResponse>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion
    }

    private static string MontarArquivoTokenCookieName(Guid pedidoId)
    {
        return $"pedido-arquivo-token-{pedidoId:N}";
    }
}
