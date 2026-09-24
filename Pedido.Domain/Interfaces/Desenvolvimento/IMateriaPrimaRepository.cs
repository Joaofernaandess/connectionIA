using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IMateriaPrimaRepository
{
    Task<Guid> Cadastrar(MateriaPrima materiaPrima);
    Task<List<MateriaPrimaGetResponse>> Obter(MateriaPrimaGetRequest request);
}
