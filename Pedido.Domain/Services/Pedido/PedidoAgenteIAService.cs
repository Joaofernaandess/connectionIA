using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Globalization;

namespace Pedido.Domain.Services;

public class PedidoAgenteIAService : BaseService
{
    private readonly PedidoService _pedidoService;
    private readonly IPedidoRepository _pedidoRepository;
    private readonly IPedidoItemRepository _pedidoItemRepository;
    private readonly ClienteServiceIA _clienteServiceIA;
    private readonly FornecedorServiceIA _fornecedorServiceIA;

    public PedidoAgenteIAService(
        PedidoService pedidoService,
        IPedidoRepository pedidoRepository,
        IPedidoItemRepository pedidoItemRepository,
        ClienteServiceIA clienteServiceIA,
        FornecedorServiceIA fornecedorServiceIA)
    {
        _pedidoService = pedidoService;
        _pedidoRepository = pedidoRepository;
        _pedidoItemRepository = pedidoItemRepository;
        _clienteServiceIA = clienteServiceIA;
        _fornecedorServiceIA = fornecedorServiceIA;
    }

    public async Task AtualizarPedidoComAnaliseIA(Guid pedidoId, PedidoAnaliseIAResponse analise)
    {
        var pedidoExistente = await _pedidoRepository.Obter(pedidoId);

        if (pedidoExistente == null)
        {
            Console.WriteLine($"Análise IA ignorada. Pedido {pedidoId} não encontrado.");
            return;
        }

        var cliente = await _clienteServiceIA.CadastrarOuObterClientePorAnaliseIA(CriarClienteAnaliseIARequest(analise));
        var fornecedor = await _fornecedorServiceIA.CadastrarOuObterFornecedorPorAnaliseIA(CriarFornecedorAnaliseIARequest(analise));

        var pedidoRequest = new PedidoPutRequest
        {
            ClienteId = cliente.ClienteId,
            FornecedorId = fornecedor.FornecedorId,
            NumeroPedido = analise.NumeroPedido,
            DataEmissao = ConverterDataAnaliseIA(analise.DataEmissao),
            DataFaturamento = ConverterDataAnaliseIA(analise.DataFaturamento),
            CondicaoPagamento = analise.CondicaoPagamento,
            Representante = analise.Representante,
            PercentualDesconto = analise.PercentualDesconto,
            TotalPares = analise.TotalPares,
            TotalBruto = analise.TotalBruto,
            ValorDesconto = analise.ValorDesconto,
            TotalLiquido = analise.TotalLiquido,
            Observacoes = analise.Observacoes
        };

        await _pedidoService.Atualizar(pedidoId, pedidoRequest, PedidoStatus.AguardandoAnaliseGestor);
        await _pedidoItemRepository.Excluir(pedidoId);

        foreach (var itemAnalise in analise.Itens)
        {
            var pedidoItem = new PedidoItem
            {
                PedidoItemId = Guid.NewGuid(),
                PedidoId = pedidoId,
                Sequencia = itemAnalise.Sequencia,
                Referencia = itemAnalise.Referencia ?? string.Empty,
                MaterialCor = itemAnalise.MaterialCor ?? string.Empty,
                Quantidade = itemAnalise.Quantidade,
                ValorUnitario = itemAnalise.ValorUnitario,
                ValorTotal = itemAnalise.ValorTotal
            };

            var pedidoItemId = await _pedidoItemRepository.Cadastrar(pedidoItem);

            foreach (var gradeAnalise in itemAnalise.Grades ?? [])
            {
                var grade = new PedidoItemGrade
                {
                    PedidoItemGradeId = Guid.NewGuid(),
                    PedidoItemId = pedidoItemId,
                    Numeracao = gradeAnalise.Numeracao ?? string.Empty,
                    Quantidade = gradeAnalise.Quantidade
                };

                await _pedidoItemRepository.CadastrarGrade(grade);
            }
        }
    }

    private static DateTime? ConverterDataAnaliseIA(string data)
    {
        if (string.IsNullOrWhiteSpace(data))
            return null;

        string[] formatos = ["yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy"];

        return DateTime.TryParseExact(data, formatos, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dataConvertida)
            ? dataConvertida
            : null;
    }

    private static ClienteAnaliseIARequest CriarClienteAnaliseIARequest(PedidoAnaliseIAResponse analise)
    {
        return new ClienteAnaliseIARequest
        {
            Cnpj = analise.ClienteCnpj
        };
    }

    private static FornecedorAnaliseIARequest CriarFornecedorAnaliseIARequest(PedidoAnaliseIAResponse analise)
    {
        return new FornecedorAnaliseIARequest
        {
            Cnpj = analise.FornecedorCnpj
        };
    }
}
