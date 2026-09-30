namespace Pedido.Domain.Models;

public class Linha
{
    public Guid LinhaId { get; set; }
    public string NumeroLinha { get; set; } = string.Empty;
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinha Categoria { get; set; }
    public GeneroLinha Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string ClienteSigla { get; set; } = string.Empty;
    public ProcessoProdutivoLinha ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public string Fabricante { get; set; } = string.Empty;
    public string FabricanteSigla { get; set; } = string.Empty;
    public decimal Rendimento { get; set; }
}

public class LinhaPostRequest
{
    public string NumeroLinha { get; set; } = string.Empty;
    public short? NumeroInicial { get; set; }
    public short? NumeroFinal { get; set; }
    public CategoriaLinha Categoria { get; set; }
    public GeneroLinha Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public ProcessoProdutivoLinha ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public decimal Rendimento { get; set; }
}

public class LinhaPutRequest
{
    public string NumeroLinha { get; set; } = string.Empty;
    public short? NumeroInicial { get; set; }
    public short? NumeroFinal { get; set; }
    public CategoriaLinha Categoria { get; set; }
    public GeneroLinha Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public ProcessoProdutivoLinha ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public decimal Rendimento { get; set; }
}

public class LinhaGetRequest : GetQueryRequestBase
{
    public string? NumeroLinha { get; set; }
    public CategoriaLinha? Categoria { get; set; }
    public GeneroLinha? Genero { get; set; }
    public Guid? FabricanteId { get; set; }
}

public class LinhaGetResponse
{
    public Guid LinhaId { get; set; }
    public string NumeroLinha { get; set; } = string.Empty;
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinha Categoria { get; set; }
    public GeneroLinha Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string ClienteSigla { get; set; } = string.Empty;
    public ProcessoProdutivoLinha ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public string Fabricante { get; set; } = string.Empty;
    public string FabricanteSigla { get; set; } = string.Empty;
    public decimal Rendimento { get; set; }
}
