namespace Pedido.Domain.Interfaces;

public interface IPedidoNotificationService
{
    Task EnviarSolicitacaoRevisaoPedidoAsync(string telefone, string numeroPedido);
}
