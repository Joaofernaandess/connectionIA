namespace Pedido.Domain.Models;

public class ReferenciaProduto
{
    public Guid ReferenciaProdutoId { get; set; }
    public Guid LinhaProdutoId { get; set; }
    public int NumeroReferencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string? Observacao { get; set; }
    public DateTime DataCriacao { get; set; }
}

public class ReferenciaProdutoPostRequest
{
    public Guid LinhaProdutoId { get; set; }
    public string? Observacao { get; set; }
}

public class ReferenciaProdutoGetRequest : GetQueryRequestBase
{
    public Guid? LinhaProdutoId { get; set; }
}

public class ReferenciaProdutoPostResponse
{
    public Guid ReferenciaProdutoId { get; set; }
    public Guid LinhaProdutoId { get; set; }
    public int Linha { get; set; }
    public int NumeroReferencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string? Observacao { get; set; }
}

public class ReferenciaProdutoGetResponse
{
    public Guid ReferenciaProdutoId { get; set; }
    public Guid LinhaProdutoId { get; set; }
    public int Linha { get; set; }
    public int NumeroReferencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
    public string? Observacao { get; set; }
    public DateTime DataCriacao { get; set; }
}

public class ReferenciaProdutoProximaResponse
{
    public Guid LinhaProdutoId { get; set; }
    public int Linha { get; set; }
    public int ProximaReferencia { get; set; }
    public string Referencia { get; set; } = string.Empty;
}
