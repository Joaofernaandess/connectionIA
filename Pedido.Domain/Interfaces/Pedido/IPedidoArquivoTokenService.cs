namespace Pedido.Domain.Interfaces;

public interface IPedidoArquivoTokenService
{
    (string Token, DateTime ExpiraEm) Gerar(Guid pedidoId, int expiracaoSegundos);
    bool Validar(Guid pedidoId, string token);
}
