using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class PedidoItemService : BaseService
{
    private readonly IPedidoRepository _pedidoRepository;
    private readonly IPedidoItemRepository _pedidoItemRepository;

    public PedidoItemService(IPedidoRepository pedidoRepository, IPedidoItemRepository pedidoItemRepository)
    {
        _pedidoRepository = pedidoRepository;
        _pedidoItemRepository = pedidoItemRepository;
    }

    public async Task<Guid> Cadastrar(Guid pedidoId, PedidoItemPostRequest itemRequest)
    {
        try
        {
            await ValidarItem(pedidoId, itemRequest);

            var quantidade = itemRequest.Grades.Sum(grade => grade.Quantidade);

            var item = new PedidoItem
            {
                PedidoItemId = Guid.NewGuid(),
                PedidoId = pedidoId,
                Sequencia = itemRequest.Sequencia,
                Referencia = itemRequest.Referencia,
                MaterialCor = itemRequest.MaterialCor,
                Quantidade = quantidade,
                ValorUnitario = itemRequest.ValorUnitario,
                ValorTotal = itemRequest.ValorTotal
            };

            var pedidoItemId = await _pedidoItemRepository.Cadastrar(item);

            foreach (var gradeRequest in itemRequest.Grades)
            {
                var grade = new PedidoItemGrade
                {
                    PedidoItemGradeId = Guid.NewGuid(),
                    PedidoItemId = pedidoItemId,
                    Numeracao = gradeRequest.Numeracao,
                    Quantidade = gradeRequest.Quantidade
                };

                await _pedidoItemRepository.CadastrarGrade(grade);
            }

            return pedidoItemId;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar item do pedido: {ex.Message}");
        }
    }

    public async Task<List<PedidoItemGetResponse>> Obter(Guid pedidoId)
    {
        try
        {
            await ValidarPedidoExiste(pedidoId);

            return await _pedidoItemRepository.Obter(pedidoId);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter itens do pedido: {ex.Message}");
        }
    }

    public async Task Excluir(Guid pedidoId)
    {
        try
        {
            await ValidarPedidoExiste(pedidoId, bloquearEdicao: true);

            await _pedidoItemRepository.Excluir(pedidoId);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao excluir itens do pedido: {ex.Message}");
        }
    }

    private async Task ValidarItem(Guid pedidoId, PedidoItemPostRequest item)
    {
        await ValidarPedidoExiste(pedidoId, bloquearEdicao: true);

        if (string.IsNullOrWhiteSpace(item.Referencia))
            AddError(nameof(item.Referencia), "Informe a referência do item.");

        if (string.IsNullOrWhiteSpace(item.MaterialCor))
            AddError(nameof(item.MaterialCor), "Informe o material/cor do item.");

        if (!item.Grades.Any())
            AddError(nameof(item.Grades), "Informe ao menos uma grade do item.");

        if (item.ValorUnitario < 0)
            AddError(nameof(item.ValorUnitario), "Informe um valor unitário válido.");

        if (item.ValorTotal < 0)
            AddError(nameof(item.ValorTotal), "Informe um valor total válido.");

        foreach (var grade in item.Grades)
        {
            if (string.IsNullOrWhiteSpace(grade.Numeracao))
                AddError(nameof(grade.Numeracao), "Informe a numeração da grade.");

            if (grade.Quantidade <= 0)
                AddError(nameof(grade.Quantidade), "Informe uma quantidade de grade maior que zero.");
        }

        if (item.Grades.Any() && item.Grades.Sum(grade => grade.Quantidade) <= 0)
            AddError(nameof(item.Grades), "A soma das quantidades das grades deve ser maior que zero.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarPedidoExiste(Guid pedidoId, bool bloquearEdicao = false)
    {
        if (pedidoId == Guid.Empty)
            throw new NotFoundException("Pedido não encontrado com o ID informado.");

        var pedido = await _pedidoRepository.Obter(pedidoId);

        if (pedido == null)
            throw new NotFoundException("Pedido não encontrado com o ID informado.");

        if (bloquearEdicao && pedido.Status != PedidoStatus.AguardandoAnaliseGestor.ToString())
        {
            AddError(nameof(PedidoStatus), "Pedido permite edição apenas quando estiver aguardando análise do gestor.");
            throw new ValidationException(Errors);
        }
    }
}
