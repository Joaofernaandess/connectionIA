using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IPedidoUploadService
{
    Task<PedidoUploadResponse> Upload(PedidoUploadRequest request, Guid usuarioId);
}
