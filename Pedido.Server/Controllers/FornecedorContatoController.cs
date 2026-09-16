using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class FornecedorContatoController
{
    public static void MapFornecedorContatoEndpoints(this WebApplication app)
    {
        app.MapPost("v1/fornecedores/{fornecedorId:guid}/contatos", async (FornecedorContatoService service, Guid fornecedorId, FornecedorContatoPostRequest contato) =>
        {
            Guid contatoId = await service.Cadastrar(fornecedorId, contato);

            return Results.Created($"v1/fornecedores/{fornecedorId}/contatos/{contatoId}", "Contato cadastrado com sucesso.");
        })
       .WithTags("fornecedor contatos")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPost("v1/fornecedores/{fornecedorId:guid}/contatos/validacoes", async (FornecedorContatoService service, Guid fornecedorId, FornecedorContatoValidacaoRequest contato) =>
        {
            await service.Validar(fornecedorId, contato);

            return Results.Ok("Contato validado com sucesso.");
        })
       .WithTags("fornecedor contatos")
       .WithSummary("Valida um contato do fornecedor")
       .WithDescription("Valida os dados de contato do fornecedor sem persistir alterações.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPut("v1/fornecedores/{fornecedorId:guid}/contatos/{fornecedorContatoId:guid}", async (FornecedorContatoService service, Guid fornecedorId, Guid fornecedorContatoId, FornecedorContatoPutRequest contato) =>
        {
            await service.Atualizar(fornecedorId, fornecedorContatoId, contato);

            return Results.Ok("Contato atualizado com sucesso.");
        })
       .WithTags("fornecedor contatos")
       .Produces(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapDelete("v1/fornecedores/{fornecedorId:guid}/contatos/{fornecedorContatoId:guid}", async (FornecedorContatoService service, Guid fornecedorId, Guid fornecedorContatoId) =>
        {
            await service.Excluir(fornecedorId, fornecedorContatoId);

            return Results.Ok("Contato excluído com sucesso.");
        })
       .WithTags("fornecedor contatos")
       .Produces(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPut("v1/fornecedores/{fornecedorId:guid}/contatos/{fornecedorContatoId:guid}/default", async (FornecedorContatoService service, Guid fornecedorId, Guid fornecedorContatoId) =>
        {
            await service.DefinirDefault(fornecedorId, fornecedorContatoId);

            return Results.Ok("Contato definido como padrão.");
        })
       .WithTags("fornecedor contatos")
       .Produces(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
    }
}
