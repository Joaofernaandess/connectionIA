using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Pedido.Data.Repositories;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Services;
using Pedido.Infra.Hubs;
using Pedido.Infra.Services;
using Pedido.Server.AuthServices;
using Pedido.Server.Controllers;
using Pedido.Server.Startup;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

const long maxRequestBodySizeBytes = 140 * 1024 * 1024;

var connectionString =
    Environment.GetEnvironmentVariable("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "A variável de ambiente DefaultConnection não foi encontrada ou configurada.");
}

builder.Services.AddScoped<IDbConnection>(
    _ => DbConnectionFactory.CriarPostgreSqlConnection(connectionString));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

builder.Services.AddJwtConfiguration();
builder.Services.AddRateLimiterConfiguration();

builder.Services.AddScoped<IAuthRepository, Pedido.Data.Repositories.AuthRepository>();
builder.Services.AddScoped<IUsuarioRepository, Pedido.Data.Repositories.UsuarioRepository>();
builder.Services.AddScoped<IPedidoRepository, Pedido.Data.Repositories.PedidoRepository>();
builder.Services.AddScoped<IPedidoAvaliacaoGestorRepository, Pedido.Data.Repositories.PedidoAvaliacaoGestorRepository>();
builder.Services.AddScoped<IPedidoItemRepository, Pedido.Data.Repositories.PedidoItemRepository>();
builder.Services.AddScoped<IClienteRepository, Pedido.Data.Repositories.ClienteRepository>();
builder.Services.AddScoped<IClienteEnderecoRepository, Pedido.Data.Repositories.ClienteEnderecoRepository>();
builder.Services.AddScoped<IClienteContatoRepository, Pedido.Data.Repositories.ClienteContatoRepository>();
builder.Services.AddScoped<IFornecedorRepository, Pedido.Data.Repositories.FornecedorRepository>();
builder.Services.AddScoped<IFornecedorEnderecoRepository, Pedido.Data.Repositories.FornecedorEnderecoRepository>();
builder.Services.AddScoped<IFornecedorContatoRepository, Pedido.Data.Repositories.FornecedorContatoRepository>();
builder.Services.AddScoped<ILinhaProdutoRepository, Pedido.Data.Repositories.LinhaProdutoRepository>();
builder.Services.AddScoped<IReferenciaProdutoRepository, Pedido.Data.Repositories.ReferenciaProdutoRepository>();
builder.Services.AddScoped<ICorRepository, Pedido.Data.Repositories.CorRepository>();
builder.Services.AddScoped<IAgendaRepository, Pedido.Data.Repositories.AgendaRepository>();
builder.Services.AddScoped<IProgramacaoRepository, Pedido.Data.Repositories.ProgramacaoRepository>();
builder.Services.AddScoped<IRelatorioRepository, Pedido.Data.Repositories.RelatorioRepository>();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<PedidoService>();
builder.Services.AddScoped<PedidoAgenteIAService>();
builder.Services.AddScoped<PedidoArquivoService>();
builder.Services.AddScoped<PedidoItemService>();
builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<ClienteServiceIA>();
builder.Services.AddScoped<FornecedorService>();
builder.Services.AddScoped<FornecedorServiceIA>();
builder.Services.AddScoped<FornecedorEnderecoService>();
builder.Services.AddScoped<FornecedorContatoService>();
builder.Services.AddScoped<LinhaProdutoService>();
builder.Services.AddScoped<ReferenciaProdutoService>();
builder.Services.AddScoped<CorService>();
builder.Services.AddScoped<AgendaService>();
builder.Services.AddScoped<ProgramacaoService>();
builder.Services.AddScoped<RelatorioService>();
builder.Services.AddScoped<IRelatorioPdfService, RelatorioPdfService>();
builder.Services.AddScoped<IHttpClientService, HttpClientService>();
builder.Services.AddScoped<IPedidoFileStorageService, FileStorageService>();
builder.Services.AddScoped<IPedidoSeparadorService, PedidoSeparadorService>();
builder.Services.AddScoped<IPedidoUploadService, PedidoUploadService>();
builder.Services.AddScoped<IPedidoArquivoTokenService, PedidoArquivoTokenService>();
builder.Services.AddScoped<IPedidoAtualizacaoNotifier, PedidoAtualizacaoNotifier>();
builder.Services.AddHttpClient<NotificationService>();
builder.Services.AddScoped<IAuthNotificationService>(provider => provider.GetRequiredService<NotificationService>());
builder.Services.AddScoped<IPedidoNotificationService>(provider => provider.GetRequiredService<NotificationService>());
builder.Services.AddScoped<IAuthPasswordService, AuthPasswordService>();
builder.Services.AddScoped<IAuthTokenService, AuthTokenService>();
builder.Services.AddScoped<IUsuarioPasswordService, UsuarioPasswordService>();
builder.Services.AddScoped<ClienteEnderecoService>();
builder.Services.AddScoped<ClienteContatoService>();
builder.Services.AddScoped<
    IPasswordHasher<Usuario>,
    PasswordHasher<Usuario>>();
builder.Services.AddScoped<
    IPasswordHasher<AuthUsuario>,
    PasswordHasher<AuthUsuario>>();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit =
        maxRequestBodySizeBytes;
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize =
        maxRequestBodySizeBytes;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("*", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithExposedHeaders("X-Zenite-Message");
    });
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("*");
app.UseRateLimiter();
app.UseJwtValidation();

app.MapControllers();
app.MapAuthEndpoints();
app.MapUsuarioEndpoints();
app.MapPedidoEndpoints();
app.MapPedidoItemEndpoints();
app.MapClienteEndpoints();
app.MapClienteEnderecoEndpoints();
app.MapClienteContatoEndpoints();
app.MapFornecedorEndpoints();
app.MapFornecedorEnderecoEndpoints();
app.MapFornecedorContatoEndpoints();
app.MapLinhaProdutoEndpoints();
app.MapReferenciaProdutoEndpoints();
app.MapCorEndpoints();
app.MapAgendaEndpoints();
app.MapProgramacaoEndpoints();
app.MapRelatorioEndpoints();
app.MapHub<PedidoHub>("/hubs/pedidos");
app.MapHealthChecks("/health");

app.Run();
