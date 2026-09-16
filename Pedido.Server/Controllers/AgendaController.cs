using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class AgendaController
{
    public static void MapAgendaEndpoints(this IEndpointRouteBuilder app)
    {
        #region [ post ]
        app.MapPost("v1/agenda", async (AgendaPostRequest request, AgendaService agendaService) =>
        {
            await agendaService.CriarAgenda(request);

            return Results.Created("/v1/agenda", "Agenda criada com sucesso.");
        })
        .WithTags("agenda")
        .WithSummary("Cria dias de agenda")
        .WithDescription("Cria dias de agenda, define se são úteis ou não e grava as produções dos pedidos informados.")
        .Produces(StatusCodes.Status201Created)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/agenda/{agendaId:guid}", async (Guid agendaId, AgendaPutRequest request, AgendaService agendaService) =>
        {
            await agendaService.AtualizarAgenda(agendaId, request);

            return Results.Ok("Agenda atualizada com sucesso.");
        })
        .WithTags("agenda")
        .WithSummary("Atualiza um dia de agenda")
        .WithDescription("Atualiza o dia da agenda, regra de utilidade, motivo e substitui as produções vinculadas.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get agenda ]
        app.MapGet("v1/agenda", async (AgendaService agendaService) =>
        {
            var result = await agendaService.ObterAgenda();

            return Results.Ok(result);
        })
        .WithTags("agenda")
        .WithSummary("Retorna agenda")
        .WithDescription("Retorna os dias da agenda e as produções vinculadas a cada dia.")
        .Produces<List<AgendaResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion
    }
}
