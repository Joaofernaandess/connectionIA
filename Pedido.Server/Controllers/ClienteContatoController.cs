using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class ClienteContatoController
{
    public static void MapClienteContatoEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/clientes/{clienteId:guid}/contatos", async (ClienteContatoService service, Guid clienteId, ClienteContatoPostRequest contato) =>
        {
            var clienteContatoId = await service.Cadastrar(clienteId, contato);

            return Results.Created($"v1/clientes/{clienteId}/contatos/{clienteContatoId}", "Contato do cliente cadastrado com sucesso.");
        })
       .WithTags("clientes-contato")
       .WithSummary("Cadastra um contato do cliente")
       .WithDescription("Cadastra um novo contato vinculado ao cliente informado.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post validacoes ]
        app.MapPost("v1/clientes/{clienteId:guid}/contatos/validacoes", async (ClienteContatoService service, Guid clienteId, ClienteContatoValidacaoRequest contato) =>
        {
            await service.Validar(clienteId, contato);

            return Results.Ok("Contato validado com sucesso.");
        })
       .WithTags("clientes-contato")
       .WithSummary("Valida um contato do cliente")
       .WithDescription("Valida os dados de contato do cliente sem persistir alterações.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/clientes/{clienteId:guid}/contatos/{clienteContatoId:guid}", async (ClienteContatoService service, Guid clienteId, Guid clienteContatoId, ClienteContatoPutRequest contato) =>
        {
            await service.Atualizar(clienteId, clienteContatoId, contato);

            return Results.Ok("Contato do cliente atualizado com sucesso.");
        })
       .WithTags("clientes-contato")
       .WithSummary("Atualiza um contato do cliente")
       .WithDescription("Atualiza um contato específico vinculado ao cliente informado.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPut("v1/clientes/{clienteId:guid}/contatos/{clienteContatoId:guid}/default", async (ClienteContatoService service, Guid clienteId, Guid clienteContatoId) =>
        {
            await service.DefinirDefault(clienteId, clienteContatoId);

            return Results.Ok("Contato padrão definido com sucesso.");
        })
       .WithTags("clientes-contato")
       .WithSummary("Define o contato padrão do cliente")
       .WithDescription("Define um contato específico como padrão do cliente informado.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ delete ]
        app.MapDelete("v1/clientes/{clienteId:guid}/contatos/{clienteContatoId:guid}", async (ClienteContatoService service, Guid clienteId, Guid clienteContatoId) =>
        {
            await service.Excluir(clienteId, clienteContatoId);

            return Results.NoContent();
        })
       .WithTags("clientes-contato")
       .WithSummary("Exclui um contato do cliente")
       .WithDescription("Exclui um contato específico vinculado ao cliente informado.")
       .Produces(StatusCodes.Status204NoContent)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}