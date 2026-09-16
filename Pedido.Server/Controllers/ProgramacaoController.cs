using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class ProgramacaoController
{
    public static void MapProgramacaoEndpoints(this IEndpointRouteBuilder app)
    {
        #region [ post ]
        app.MapPost("v1/programacoes", async (ProgramacaoRequest request, ProgramacaoService programacaoService) =>
        {
            await programacaoService.SalvarProgramacao(request);

            return Results.Ok("Programação salva com sucesso.");
        })
        .WithTags("programacao")
        .WithSummary("Salva programações")
        .WithDescription("Substitui as programações dos pedidos informados em uma única transação.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ put by agenda ]
        app.MapPut("v1/agenda/{agendaId:guid}/programacoes", async (Guid agendaId, List<ProgramacaoItemRequest> programacoes, ProgramacaoService programacaoService) =>
        {
            await programacaoService.SalvarProgramacao(new ProgramacaoRequest
            {
                Agendas =
                [
                    new ProgramacaoAgendaRequest
                    {
                        AgendaId = agendaId,
                        Programacoes = programacoes
                    }
                ]
            });

            return Results.Ok("Programações da agenda atualizadas com sucesso.");
        })
        .WithTags("programacao")
        .WithSummary("Atualiza programações de uma agenda")
        .WithDescription("Substitui as programações dos pedidos informados e vincula as novas quantidades à agenda informada.")
        .Produces(StatusCodes.Status200OK)
        .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get by agenda ]
        app.MapGet("v1/agenda/{agendaId:guid}/programacoes", async (Guid agendaId, ProgramacaoService programacaoService) =>
        {
            var result = await programacaoService.ObterPorAgenda(agendaId);

            return Results.Ok(result);
        })
        .WithTags("programacao")
        .WithSummary("Retorna as programações de uma agenda")
        .WithDescription("Retorna os pedidos e quantidades de programação vinculados à agenda informada.")
        .Produces<List<ProgramacaoResponse>>(StatusCodes.Status200OK)
        .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion
    }
}
