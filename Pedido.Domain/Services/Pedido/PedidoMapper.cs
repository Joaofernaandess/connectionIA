using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public static class PedidoMapper
{
    public static PedidoGetByIdResponse MontarPedidoGetByIdResponse(PedidoGetResponse pedido)
    {
        return new PedidoGetByIdResponse
        {
            PedidoId = pedido.PedidoId,
            PedidoLinkId = pedido.PedidoLinkId,
            ClienteId = pedido.ClienteId,
            FornecedorId = pedido.FornecedorId,
            ClienteNome = pedido.ClienteNome,
            NumeroPedido = pedido.NumeroPedido,
            DataEmissao = pedido.DataEmissao,
            DataFaturamento = pedido.DataFaturamento,
            CondicaoPagamento = pedido.CondicaoPagamento,
            Representante = pedido.Representante,
            Fornecedor = pedido.Fornecedor,
            PercentualDesconto = pedido.PercentualDesconto,
            TotalPares = pedido.TotalPares,
            TotalBruto = pedido.TotalBruto,
            ValorDesconto = pedido.ValorDesconto,
            TotalLiquido = pedido.TotalLiquido,
            Observacoes = pedido.Observacoes,
            Status = pedido.Status,
            DataCriacao = pedido.DataCriacao,
            AgendaId = pedido.AgendaId,
            DataProgramacao = pedido.DataProgramacao
        };
    }

    public static PedidoStatus ObterStatusPedido(string status)
    {
        return Enum.TryParse<PedidoStatus>(status, out var pedidoStatus)
            ? pedidoStatus
            : PedidoStatus.AguardandoAnaliseIA;
    }
}