using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface ICorRepository
{
    Task<Guid> Cadastrar(Cor cor);
    Task<List<CorGetResponse>> Obter(CorGetRequest request);
    Task<Cor?> Obter(Guid corId);
    Task<bool> VerificarCorExiste(Guid corId);
}
