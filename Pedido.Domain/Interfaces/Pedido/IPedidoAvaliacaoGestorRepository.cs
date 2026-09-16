using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IPedidoAvaliacaoGestorRepository
{
    Task<int> Salvar(PedidoAvaliacaoGestor avaliacao);
    Task<PedidoAvaliacaoGestorGetResponse?> Obter(Guid pedidoId);
    Task<int> AtualizarPrompt(Guid pedidoId, Guid pedidoAvaliacaoGestorId, string prompt);
    Task<List<string>> ObterPromptsPorClienteCnpj(string cnpj);
}
