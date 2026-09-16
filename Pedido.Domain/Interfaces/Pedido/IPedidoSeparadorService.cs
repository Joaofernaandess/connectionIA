using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IPedidoSeparadorService
{
    Task<List<PedidoArquivoSeparado>> Separar(PedidoUploadRequest request, byte[] arquivo);
}
