namespace Pedido.Domain.Models;

public class Pedido
{
    public Guid PedidoId { get; set; }
    public string PedidoLinkId { get; set; } = string.Empty;
    public Guid? UsuarioId { get; set; }
    public Guid? ClienteId { get; set; }
    public Guid? FornecedorId { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public DateTime? DataEmissao { get; set; }
    public DateTime? DataFaturamento { get; set; }
    public string CondicaoPagamento { get; set; } = string.Empty;
    public string Representante { get; set; } = string.Empty;
    public decimal PercentualDesconto { get; set; }
    public int TotalPares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal TotalLiquido { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public List<PedidoItem> Itens { get; set; } = new();
    public DateTime DataCriacao { get; set; }
    public PedidoStatus Status { get; set; }
}

public class PedidoPostRequest
{
    public string PedidoLinkId { get; set; } = string.Empty;
}

public class PedidoPutRequest
{
    public Guid? ClienteId { get; set; }
    public Guid? FornecedorId { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public DateTime? DataEmissao { get; set; }
    public DateTime? DataFaturamento { get; set; }
    public string CondicaoPagamento { get; set; } = string.Empty;
    public string Representante { get; set; } = string.Empty;
    public decimal PercentualDesconto { get; set; }
    public int TotalPares { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal TotalLiquido { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public List<PedidoItemPostRequest> Itens { get; set; } = new();
}

public class PedidoGetRequest : GetQueryRequestBase
{
    public Guid? ClienteId { get; set; }
    public string? NumeroPedido { get; set; } = string.Empty;
}

public class PedidoGetResponse
{
    public Guid PedidoId { get; set; }
    public string PedidoLinkId { get; set; } = string.Empty;
    public Guid? UsuarioId { get; set; }
    public Guid? ClienteId { get; set; }
    public Guid? FornecedorId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public string NumeroPedido { get; set; } = string.Empty;
    public DateTime? DataEmissao { get; set; }
    public DateTime? DataFaturamento { get; set; }
    public string CondicaoPagamento { get; set; } = string.Empty;
    public string Representante { get; set; } = string.Empty;
    public string Fornecedor { get; set; } = string.Empty;
    public decimal PercentualDesconto { get; set; }
    public int TotalPares { get; set; }
    public string TotalParesDescricao { get; set; } = string.Empty;
    public decimal TotalBruto { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal TotalLiquido { get; set; }
    public string Observacoes { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public Guid? AgendaId { get; set; }
    public DateTime? DataProgramacao { get; set; }
}

public class PedidoGetByIdResponse : PedidoGetResponse
{
    public List<PedidoItemGetResponse> Itens { get; set; } = new();
    public PedidoAvaliacaoGestorGetResponse? AnaliseIA { get; set; }
}

public class PedidoArquivoResponse
{
    public string NomeArquivo { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Arquivo { get; set; } = Array.Empty<byte>();
}

public class PedidoArquivoTokenResponse
{
    public string Url { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; }
}

public class PedidoAvaliacaoGestor
{
    public Guid PedidoAvaliacaoGestorId { get; set; }
    public Guid PedidoId { get; set; }
    public bool Aprovado { get; set; }
    public int Nota { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public bool SolicitaRevisao { get; set; }
    public DateTime DataAvaliacao { get; set; }
}

public class PedidoAvaliacaoGestorPostRequest
{
    public bool Aprovado { get; set; }
    public int Nota { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public bool SolicitaRevisao { get; set; }
}

public class PedidoAvaliacaoGestorPromptPutRequest
{
    public string Prompt { get; set; } = string.Empty;
}

public class PedidoAvaliacaoGestorGetResponse : PedidoAvaliacaoGestorPostRequest
{
    public Guid PedidoAvaliacaoGestorId { get; set; }
    public Guid PedidoId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public DateTime DataAvaliacao { get; set; }
}

public class PedidoAvaliacaoNotaGetResponse
{
    public int Value { get; set; }
    public string Label { get; set; } = string.Empty;
}
