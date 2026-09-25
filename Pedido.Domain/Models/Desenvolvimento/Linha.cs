using Pedido.Domain.Utils;

namespace Pedido.Domain.Models;

public class Linha
{
    public Guid LinhaId { get; set; }

    [LogDescription("número da linha")]
    public int NumeroLinha { get; set; }

    [LogDescription("número inicial")]
    public short NumeroInicial { get; set; }

    [LogDescription("número final")]
    public short NumeroFinal { get; set; }

    [LogDescription("categoria")]
    public CategoriaLinha Categoria { get; set; }

    [LogDescription("gênero")]
    public GeneroLinha Genero { get; set; }

    [LogDescription("status de linha exclusiva")]
    public bool Exclusiva { get; set; }

    [LogDescription("cliente vinculado")]
    public Guid? ClienteId { get; set; }

    public string Cliente { get; set; } = string.Empty;

    [LogDescription("processo produtivo")]
    public ProcessoProdutivoLinha ProcessoProdutivo { get; set; }

    [LogDescription("fabricante vinculado")]
    public Guid? FabricanteId { get; set; }

    public string Fabricante { get; set; } = string.Empty;

    [LogDescription("rendimento")]
    public decimal Rendimento { get; set; }
}

public class LinhaPostRequest
{
    public int NumeroLinha { get; set; }
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
    public int NumeroLinha { get; set; }
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
    public int? NumeroLinha { get; set; }
    public CategoriaLinha? Categoria { get; set; }
    public GeneroLinha? Genero { get; set; }
    public Guid? FabricanteId { get; set; }
}

public class LinhaGetResponse
{
    public Guid LinhaId { get; set; }
    public int NumeroLinha { get; set; }
    public short NumeroInicial { get; set; }
    public short NumeroFinal { get; set; }
    public CategoriaLinha Categoria { get; set; }
    public GeneroLinha Genero { get; set; }
    public bool Exclusiva { get; set; }
    public Guid? ClienteId { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public ProcessoProdutivoLinha ProcessoProdutivo { get; set; }
    public Guid? FabricanteId { get; set; }
    public string Fabricante { get; set; } = string.Empty;
    public decimal Rendimento { get; set; }
}