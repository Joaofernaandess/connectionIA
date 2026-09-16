using Microsoft.AspNetCore.SignalR;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Infra.Hubs;

namespace Pedido.Infra.Services;

public class PedidoAtualizacaoNotifier : IPedidoAtualizacaoNotifier
{
    private readonly IHubContext<PedidoHub> _pedidoHub;

    public PedidoAtualizacaoNotifier(IHubContext<PedidoHub> pedidoHub)
    {
        _pedidoHub = pedidoHub;
    }

    public async Task NotificarPedidoAtualizado(Guid pedidoId, PedidoStatus status)
    {
        await _pedidoHub.Clients.All.SendAsync("pedidoAtualizado", new
        {
            pedidoId,
            status = status.ToString()
        });
    }
}
