namespace Pedido.Domain.Models;

public class LinhaProduto
{
    public Guid LinhaProdutoId { get; set; }
    public int Linha { get; set; }
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinhaProduto Categoria { get; set; }
    public GeneroLinhaProduto Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public ProcessoProdutivoLinhaProduto ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public string Fabricante { get; set; } = string.Empty;
    public decimal Rendimento { get; set; }
}

public class LinhaProdutoPostRequest
{
    public int Linha { get; set; }
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinhaProduto Categoria { get; set; }
    public GeneroLinhaProduto Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public ProcessoProdutivoLinhaProduto ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public decimal Rendimento { get; set; }
}

public class LinhaProdutoPutRequest
{
    public int Linha { get; set; }
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinhaProduto Categoria { get; set; }
    public GeneroLinhaProduto Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public ProcessoProdutivoLinhaProduto ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public decimal Rendimento { get; set; }
}

public class LinhaProdutoGetRequest : GetQueryRequestBase
{
    public int? Linha { get; set; }
    public CategoriaLinhaProduto? Categoria { get; set; }
    public GeneroLinhaProduto? Genero { get; set; }
    public Guid? FabricanteId { get; set; }
}

public class LinhaProdutoGetResponse
{
    public Guid LinhaProdutoId { get; set; }
    public int Linha { get; set; }
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinhaProduto Categoria { get; set; }
    public GeneroLinhaProduto Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public ProcessoProdutivoLinhaProduto ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public string Fabricante { get; set; } = string.Empty;
    public decimal Rendimento { get; set; }
}
