using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class FornecedorController
{
    public static void MapFornecedorEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/fornecedores/", async (FornecedorService service, FornecedorPostRequest fornecedor) =>
        {
            Guid fornecedorId = await service.Cadastrar(fornecedor);

            return Results.Created($"v1/fornecedores/{fornecedorId}", "Fornecedor cadastrado com sucesso.");
        })
       .WithTags("fornecedores")
       .WithSummary("Cadastra um novo fornecedor")
       .WithDescription("Cadastra os dados principais de um novo fornecedor.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ post por cnpj ]
        app.MapPost("v1/fornecedores/cnpj", async (FornecedorServiceIA service, FornecedorAnaliseIARequest request) =>
        {
            var fornecedor = await service.CadastrarOuObterFornecedorPorAnaliseIA(request);

            return Results.Created($"v1/fornecedores/{fornecedor.FornecedorId}", fornecedor);
        })
       .WithTags("fornecedores")
       .WithSummary("Cadastra fornecedor a partir do CNPJ")
       .WithDescription("Busca os dados do CNPJ na API externa e cadastra fornecedor, endereço e contatos.")
       .Produces<Fornecedor>(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/fornecedores", async (FornecedorService service, [AsParameters] FornecedorGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("fornecedores")
       .WithSummary("Retorna lista de fornecedores")
       .WithDescription("Retorna uma lista de fornecedores de acordo com os parâmetros informados.")
       .Produces<List<FornecedorGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get by id ]
        app.MapGet("v1/fornecedores/{fornecedorId:guid}", async (FornecedorService service, Guid fornecedorId) =>
        {
            var result = await service.Obter(fornecedorId);

            return Results.Ok(result);
        })
       .WithName("fornecedor_get_by_id")
       .WithTags("fornecedores")
       .WithSummary("Retorna um fornecedor por ID")
       .WithDescription("Retorna um fornecedor específico por ID.")
       .Produces<Fornecedor>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/fornecedores/{fornecedorId:guid}", async (FornecedorService service, Guid fornecedorId, FornecedorPutRequest fornecedor) =>
        {
            await service.Atualizar(fornecedorId, fornecedor);

            return Results.Ok("Fornecedor atualizado com sucesso.");
        })
       .WithTags("fornecedores")
       .WithSummary("Atualiza um fornecedor")
       .WithDescription("Atualiza os dados principais de um fornecedor.")
       .Produces(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }
}