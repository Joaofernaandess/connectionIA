namespace Pedido.Domain.Interfaces;

public interface IAuthNotificationService
{
    Task EnviarCodigoAcessoAsync(string telefone, string codigo);
}