using System.Threading.Channels;
using Pedido.Domain.Models;

namespace Pedido.Infra.Services;

public interface IAuditoriaQueue
{
    bool Enfileirar(AuditoriaEvento evento);
    IAsyncEnumerable<AuditoriaEvento> LerAsync(CancellationToken cancellationToken);
}

public class AuditoriaQueue : IAuditoriaQueue
{
    private readonly Channel<AuditoriaEvento> _channel =
        Channel.CreateUnbounded<AuditoriaEvento>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

    public bool Enfileirar(AuditoriaEvento evento)
    {
        return _channel.Writer.TryWrite(evento);
    }

    public IAsyncEnumerable<AuditoriaEvento> LerAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
