using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class FornecedorEnderecoController
{
    public static void MapFornecedorEnderecoEndpoints(this WebApplication app)
    {
        app.MapPost("v1/fornecedores/{fornecedorId:guid}/enderecos", async (FornecedorEnderecoService service, Guid fornecedorId, FornecedorEnderecoPostRequest endereco) =>
        {
            Guid enderecoId = await service.Cadastrar(fornecedorId, endereco);

            return Results.Created($"v1/fornecedores/{fornecedorId}/enderecos/{enderecoId}", "Endereço cadastrado com sucesso.");
        })
       .WithTags("fornecedor endereços")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPost("v1/fornecedores/{fornecedorId:guid}/enderecos/validacoes", async (FornecedorEnderecoService service, Guid fornecedorId, FornecedorEnderecoValidacaoRequest endereco) =>
        {
            await service.Validar(fornecedorId, endereco);

            return Results.Ok("Endereço validado com sucesso.");
        })
       .WithTags("fornecedor endereços")
       .WithSummary("Valida um endereço do fornecedor")
       .WithDescription("Valida os dados de endereço do fornecedor sem persistir alterações.")
       .Produces<string>(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPut("v1/fornecedores/{fornecedorId:guid}/enderecos/{fornecedorEnderecoId:guid}", async (FornecedorEnderecoService service, Guid fornecedorId, Guid fornecedorEnderecoId, FornecedorEnderecoPutRequest endereco) =>
        {
            await service.Atualizar(fornecedorId, fornecedorEnderecoId, endereco);

            return Results.Ok("Endereço atualizado com sucesso.");
        })
       .WithTags("fornecedor endereços")
       .Produces(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapDelete("v1/fornecedores/{fornecedorId:guid}/enderecos/{fornecedorEnderecoId:guid}", async (FornecedorEnderecoService service, Guid fornecedorId, Guid fornecedorEnderecoId) =>
        {
            await service.Excluir(fornecedorId, fornecedorEnderecoId);

            return Results.Ok("Endereço excluído com sucesso.");
        })
       .WithTags("fornecedor endereços")
       .Produces(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();

        app.MapPut("v1/fornecedores/{fornecedorId:guid}/enderecos/{fornecedorEnderecoId:guid}/default", async (FornecedorEnderecoService service, Guid fornecedorId, Guid fornecedorEnderecoId) =>
        {
            await service.DefinirDefault(fornecedorId, fornecedorEnderecoId);

            return Results.Ok("Endereço definido como padrão.");
        })
       .WithTags("fornecedor endereços")
       .Produces(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
    }
}
