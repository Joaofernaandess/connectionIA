namespace Pedido.Domain.Models;

public class MateriaPrima
{
    public Guid MateriaPrimaId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public UnidadeMateriaPrima Unidade { get; set; }
    public decimal Estoque { get; set; }
    public decimal Preco { get; set; }
}

public class MateriaPrimaPostRequest
{
    public string Descricao { get; set; } = string.Empty;
    public UnidadeMateriaPrima Unidade { get; set; }
    public decimal Estoque { get; set; }
    public decimal Preco { get; set; }
}

public class MateriaPrimaPostResponse
{
    public Guid MateriaPrimaId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public UnidadeMateriaPrima Unidade { get; set; }
    public decimal Estoque { get; set; }
    public decimal Preco { get; set; }
}

public class MateriaPrimaGetRequest : GetQueryRequestBase
{
    public string? Pesquisa { get; set; }
}

public class MateriaPrimaGetResponse
{
    public Guid MateriaPrimaId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public UnidadeMateriaPrima Unidade { get; set; }
    public decimal Estoque { get; set; }
    public decimal Preco { get; set; }
}
