using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;
using System.Security.Claims;

namespace Pedido.Server.Controllers;

public static class ReferenciaController
{
    public static void MapReferenciaEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/referencias/", async (HttpContext context, ReferenciaService service, ReferenciaPostRequest referencia) =>
        {
            var usuarioIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var nomeUsuario = context.User.FindFirstValue(ClaimTypes.Name) ?? "Usuário não identificado";

            if (!Guid.TryParse(usuarioIdClaim, out var usuarioId))
                return Results.Unauthorized();

            var result = await service.Cadastrar(referencia, usuarioId, nomeUsuario);
            return Results.Created($"v1/referencias/{result.ReferenciaId}", result);
        })
        .WithTags("referencias")
        .WithSummary("Cadastra uma nova referência")
        .WithDescription("Cadastra a próxima referência para a linha informada.")
        .Produces<ReferenciaPostResponse>(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/referencias", async (ReferenciaService service, [AsParameters] ReferenciaGetRequest request) =>
        {
            var result = await service.Obter(request);
            return Results.Ok(result);
        })
        .WithTags("referencias")
        .WithSummary("Retorna lista de referências")
        .WithDescription("Retorna uma lista de referências de acordo com os parâmetros informados.")
        .Produces<List<ReferenciaGetResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get by id ]
        app.MapGet("v1/referencias/{referenciaId:guid}", async (ReferenciaService service, Guid referenciaId) =>
        {
            var result = await service.Obter(referenciaId);
            return Results.Ok(result);
        })
        .WithTags("referencias")
        .WithSummary("Retorna uma referência por ID")
        .WithDescription("Retorna uma referência específica por ID.")
        .Produces<Referencia>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post validar entrada ]
        app.MapPost("v1/referencias/validar-entrada", async (ReferenciaService service, ReferenciaEntradaRequest request) =>
        {
            await service.ValidarEntrada(request);
            return Results.Ok("Entrada validada com sucesso.");
        })
        .WithTags("referencias")
        .WithSummary("Valida a entrada da referência")
        .WithDescription("Valida os dados necessários para avançar da etapa de linha e desenho.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get proxima ]
        app.MapGet("v1/referencias/proxima", async (ReferenciaService service, Guid linhaId) =>
        {
            var result = await service.ObterProxima(linhaId);
            return Results.Ok(result);
        })
        .WithTags("referencias")
        .WithSummary("Retorna a próxima referência")
        .WithDescription("Retorna a próxima referência disponível para a linha informada.")
        .Produces<ReferenciaProximaResponse>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/referencias/{referenciaId:guid}", async (HttpContext context, ReferenciaService service, Guid referenciaId, ReferenciaPutRequest referencia) =>
        {
            var usuarioIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var nomeUsuario = context.User.FindFirstValue(ClaimTypes.Name) ?? "Usuário não identificado";

            if (!Guid.TryParse(usuarioIdClaim, out var usuarioId))
                return Results.Unauthorized();

            await service.Atualizar(referenciaId, referencia, usuarioId, nomeUsuario);
            return Results.Ok("Referência atualizada com sucesso.");
        })
        .WithTags("referencias")
        .WithSummary("Atualiza uma referência")
        .WithDescription("Atualiza os dados principais de uma referência.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post desenho ]
        app.MapPost("v1/referencias/{referenciaId:guid}/desenhos", async (
            ReferenciaDesenhoService service,
            Guid referenciaId,
            ReferenciaDesenhoUploadRequest request) =>
        {
            var result = await service.CadastrarDesenhoOriginal(referenciaId, request);
            return Results.Created($"v1/referencias/{referenciaId}/desenhos/{result.ReferenciaDesenhoId}", result);
        })
        .WithTags("referencias")
        .WithSummary("Cadastra desenho da referência")
        .WithDescription("Envia o arquivo de desenho para o bucket de desenhos e vincula o link à referência.")
        .Accepts<ReferenciaDesenhoUploadRequest>("application/json")
        .Produces<ReferenciaDesenhoResponse>(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post prototipo ]
        app.MapPost("v1/referencias/{referenciaId:guid}/cores/{corId:guid}/prototipo/desenho", async (
            ReferenciaPrototipoService service,
            Guid referenciaId,
            Guid corId,
            ReferenciaDesenhoUploadRequest request) =>
        {
            var result = await service.Cadastrar(referenciaId, corId, request);
            return Results.Created($"v1/referencias/{referenciaId}/cores/{corId}/prototipo/desenho/{result.ReferenciaDesenhoId}", result);
        })
        .WithTags("referencias")
        .WithSummary("Cadastra desenho do protótipo")
        .WithDescription("Envia ou substitui o desenho do protótipo da cor informada.")
        .Accepts<ReferenciaDesenhoUploadRequest>("application/json")
        .Produces<ReferenciaDesenhoResponse>(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post cor ]
        app.MapPost("v1/referencias/{referenciaId:guid}/cores", async (
            ReferenciaService service,
            Guid referenciaId,
            ReferenciaCorPostRequest request) =>
        {
            // Nota: Se quiser auditar adição de cores, você pode repassar o usuarioId aqui depois
            var result = await service.CadastrarCor(referenciaId, request);
            return Results.Created($"v1/referencias/{referenciaId}/cores/{result.CorId}", result);
        })
        .WithTags("referencias")
        .WithSummary("Cadastra uma cor da referência")
        .WithDescription("Cadastra uma nova variação de cor para a referência informada.")
        .Produces<ReferenciaCorResponse>(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get desenho original base64 ]
        app.MapGet("v1/referencias/{referenciaId:guid}/desenhos/original/base64", async (
            ReferenciaDesenhoService service,
            Guid referenciaId) =>
        {
            var result = await service.ObterDesenhoOriginalBase64(referenciaId);
            return Results.Ok(result);
        })
        .WithTags("referencias")
        .WithSummary("Retorna desenho original da referência em base64")
        .WithDescription("Retorna o desenho original vinculado à referência em base64 para pré-visualização.")
        .Produces<ReferenciaDesenhoResponse>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get prototipo base64 ]
        app.MapGet("v1/referencias/{referenciaId:guid}/cores/{corId:guid}/prototipo/desenho/base64", async (
            ReferenciaPrototipoService service,
            Guid referenciaId,
            Guid corId) =>
        {
            var result = await service.ObterBase64(referenciaId, corId);
            return Results.Ok(result);
        })
        .WithTags("referencias")
        .WithSummary("Retorna desenho do protótipo em base64")
        .WithDescription("Retorna o desenho do protótipo da cor informada em base64 para pré-visualização.")
        .Produces<ReferenciaDesenhoResponse>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get desenhos ]
        app.MapGet("v1/referencias/{referenciaId:guid}/desenhos", async (
            ReferenciaDesenhoService service,
            Guid referenciaId) =>
        {
            var result = await service.ObterPorReferencia(referenciaId);
            return Results.Ok(result);
        })
        .WithTags("referencias")
        .WithSummary("Retorna desenhos da referência")
        .WithDescription("Retorna os desenhos vinculados à referência com URL temporária para visualização.")
        .Produces<List<ReferenciaDesenhoResponse>>(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion
    }
}