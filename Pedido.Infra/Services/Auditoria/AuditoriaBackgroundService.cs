using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Pedido.Domain.Models;
using Pedido.Infra.Hubs;
using Serilog;

namespace Pedido.Infra.Services;

public class AuditoriaBackgroundService : BackgroundService
{
    private readonly IAuditoriaQueue _queue;
    private readonly IHubContext<PedidoHub> _hubContext;
    private readonly Serilog.ILogger _logger;

    public AuditoriaBackgroundService(
        IAuditoriaQueue queue,
        IHubContext<PedidoHub> hubContext)
    {
        _queue = queue;
        _hubContext = hubContext;
        _logger = Log.ForContext("LogTipo", "Auditoria");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var evento in _queue.LerAsync(stoppingToken))
        {
            try
            {
                GravarLog(evento);

                await _hubContext.Clients.All.SendAsync(
                    "auditoriaRegistrada",
                    evento,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Erro ao processar evento de auditoria para {Entidade} {EntidadeId}.", evento.Entidade, evento.EntidadeId);
            }
        }
    }

    private void GravarLog(AuditoriaEvento evento)
    {
        _logger
            .ForContext("UsuarioId", evento.Usuario.UsuarioId)
            .ForContext("UsuarioNome", evento.Usuario.Nome)
            .ForContext("Username", evento.Usuario.Username)
            .ForContext("Acao", evento.Acao)
            .ForContext("Entidade", evento.Entidade)
            .ForContext("EntidadeId", evento.EntidadeId)
            .ForContext("Alteracoes", evento.Alteracoes, true)
            .Information("{Descricao}", evento.Descricao);
    }
}
