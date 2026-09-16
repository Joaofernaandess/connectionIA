using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Domain.Utils;

namespace Pedido.Server.Controllers;

public static class ClienteController
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        #region [ post ]
        app.MapPost("v1/clientes/", async (ClienteService service, ClientePostRequest cliente) =>
        {
            Guid clienteId = await service.Cadastrar(cliente);

            return Results.Created($"v1/clientes/{clienteId}", "Cliente cadastrado com sucesso.");
        })
       .WithTags("clientes")
       .WithSummary("Cadastra um novo cliente")
       .WithDescription("Cadastra os dados principais de um novo cliente.")
       .Produces(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion 

        #region [ post por cnpj ]
        app.MapPost("v1/clientes/cnpj", async (ClienteServiceIA service, ClienteAnaliseIARequest request) =>
        {
            var cliente = await service.CadastrarOuObterClientePorAnaliseIA(request);

            return Results.Created($"v1/clientes/{cliente.ClienteId}", cliente);
        })
       .WithTags("clientes")
       .WithSummary("Cadastra cliente a partir do CNPJ")
       .WithDescription("Busca os dados do CNPJ na API externa e cadastra cliente, endereço e contatos.")
       .Produces<Cliente>(StatusCodes.Status201Created)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ get ]
        app.MapGet("v1/clientes", async (ClienteService service, [AsParameters] ClienteGetRequest request) =>
        {
            var result = await service.Obter(request);

            return Results.Ok(result);
        })
       .WithTags("clientes")
       .WithSummary("Retorna lista de clientes")
       .WithDescription("Retorna uma lista de clientes de acordo com os parâmetros informados.")
       .Produces<List<ClienteGetResponse>>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status500InternalServerError)
        .RequireAuthorization();
        #endregion

        #region [ get prompts ]
        app.MapGet("v1/clientes/prompts", async (HttpContext context, ClienteServiceIA service, string cnpj) =>
        {
            if (!ValidarTokenAnaliseIA(context))
                return Results.Unauthorized();

            var result = await service.ObterPromptsPorCnpj(cnpj);

            return Results.Ok(result);
        })
       .WithTags("clientes")
       .WithSummary("Retorna prompts de correção do cliente")
       .WithDescription("Retorna os prompts de avaliação do gestor vinculados a pedidos do cliente informado por CNPJ.")
       .Produces<List<string>>(StatusCodes.Status200OK)
       .Produces(StatusCodes.Status401Unauthorized)
       .Produces<string>(StatusCodes.Status500InternalServerError);
        #endregion

        #region [ get by id ]
        app.MapGet("v1/clientes/{clienteId:guid}", async (ClienteService service, Guid clienteId) =>
        {
            var result = await service.Obter(clienteId);

            return Results.Ok(result);
        })
       .WithName("cliente_get_by_id")
       .WithTags("clientes")
       .WithSummary("Retorna um cliente por ID")
       .WithDescription("Retorna um cliente específico por ID.")
       .Produces<Cliente>(StatusCodes.Status200OK)
       .Produces<string>(StatusCodes.Status404NotFound)
        .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion

        #region [ put ]
        app.MapPut("v1/clientes/{clienteId:guid}", async (ClienteService service, Guid clienteId, ClientePutRequest cliente) =>
        {
            await service.Atualizar(clienteId, cliente);

            return Results.Ok("Cliente atualizado com sucesso.");
        })
       .WithTags("clientes")
       .WithSummary("Atualiza um cliente")
       .WithDescription("Atualiza os dados principais de um cliente.")
       .Produces(StatusCodes.Status200OK)
       .Produces<List<ValidationError>>(StatusCodes.Status400BadRequest)
       .Produces<string>(StatusCodes.Status404NotFound)
       .Produces<string>(StatusCodes.Status500InternalServerError)
       .RequireAuthorization();
        #endregion
    }

    private static bool ValidarTokenAnaliseIA(HttpContext context)
    {
        var webhookToken = Environment.GetEnvironmentVariable("PEDIDO_ANALISE_IA_WEBHOOK_TOKEN")?.Trim();

        if (string.IsNullOrWhiteSpace(webhookToken))
            return true;

        var token = context.Request.Headers["X-Pedido-Analise-IA-Webhook-Token"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(token))
            token = context.Request.Query["webhookToken"].FirstOrDefault();

        return token?.Trim() == webhookToken;
    }
}