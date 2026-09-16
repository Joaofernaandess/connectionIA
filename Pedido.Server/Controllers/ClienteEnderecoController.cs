using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class ClienteEnderecoController
{
    public static void MapClienteEnderecoEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/clientes/{clienteId:guid}/enderecos", async (ClienteEnderecoService service, Guid clienteId, ClienteEnderecoPostRequest endereco) =>
        {
            Guid clienteEnderecoId = await service.Cadastrar(clienteId, endereco);

            return Results.Created($"v1/clientes/{clienteId}/enderecos/{clienteEnderecoId}", "Endereço do cliente cadastrado com sucesso.");
        })
       .WithTags("clientes-endereço")
       .WithSummary("Cadastra um endereço do cliente")
       .WithDescription("Cadastra um novo endereço vinculado ao cliente informado.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ post validacoes ]
        app.MapPost("v1/clientes/{clienteId:guid}/enderecos/validacoes", async (ClienteEnderecoService service, Guid clienteId, ClienteEnderecoValidacaoRequest endereco) =>
        {
            await service.Validar(clienteId, endereco);

            return Results.Ok("Endereço validado com sucesso.");
        })
       .WithTags("clientes-endereço")
       .WithSummary("Valida um endereço do cliente")
       .WithDescription("Valida os dados de endereço do cliente sem persistir alterações.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/clientes/{clienteId:guid}/enderecos/{clienteEnderecoId:guid}", async (ClienteEnderecoService service, Guid clienteId, Guid clienteEnderecoId, ClienteEnderecoPutRequest endereco) =>
        {
            await service.Atualizar(clienteId, clienteEnderecoId, endereco);

            return Results.Ok("Endereço do cliente atualizado com sucesso.");
        })
       .WithTags("clientes-endereço")
       .WithSummary("Atualiza um endereço do cliente")
       .WithDescription("Atualiza um endereço específico vinculado ao cliente informado.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPut("v1/clientes/{clienteId:guid}/enderecos/{clienteEnderecoId:guid}/default", async (ClienteEnderecoService service, Guid clienteId, Guid clienteEnderecoId) =>
        {
            await service.DefinirDefault(clienteId, clienteEnderecoId);

            return Results.Ok("Endereço padrão definido com sucesso.");
        })
       .WithTags("clientes-endereço")
       .WithSummary("Define o endereço padrão do cliente")
       .WithDescription("Define um endereço específico como padrão do cliente informado.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ delete ]
        app.MapDelete("v1/clientes/{clienteId:guid}/enderecos/{clienteEnderecoId:guid}", async (ClienteEnderecoService service, Guid clienteId, Guid clienteEnderecoId) =>
        {
            await service.Excluir(clienteId, clienteEnderecoId);

            return Results.NoContent();
        })
       .WithTags("clientes-endereço")
       .WithSummary("Exclui um endereço do cliente")
       .WithDescription("Exclui um endereço específico vinculado ao cliente informado.")
       .Produces(StatusCodes.Status204NoContent)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}