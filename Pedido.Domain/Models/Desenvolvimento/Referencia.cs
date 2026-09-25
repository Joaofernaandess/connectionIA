using Pedido.Domain.Utils;

namespace Pedido.Domain.Models;

public class Referencia
{
    public Guid ReferenciaId { get; set; }

    [LogDescription("linha vinculada")]
    public Guid LinhaId { get; set; }

    [LogDescription("número da referência")]
    public int NumeroReferencia { get; set; }

    [LogDescription("código da referência")]
    public string CodigoReferencia { get; set; } = string.Empty;

    [LogDescription("sigla")]
    public string Sigla { get; set; } = string.Empty;

    [LogDescription("observações da estrutura base")]
    public string? Observacao { get; set; }

    public DateTime DataCriacao { get; set; }

    public List<ReferenciaCorResponse> Cores { get; set; } = [];
}

public class ReferenciaPostRequest
{
    public Guid LinhaId { get; set; }
    public Guid? CorId { get; set; }
    public string Sigla { get; set; } = string.Empty;
    public string? Observacao { get; set; }
}

public class ReferenciaPutRequest
{
    public Guid LinhaId { get; set; }
    public Guid? CorId { get; set; }
    public string Sigla { get; set; } = string.Empty;
    public string? Observacao { get; set; }
}

public class ReferenciaEntradaRequest
{
    public Guid LinhaId { get; set; }
    public bool PossuiDesenho { get; set; }
}

public class ReferenciaGetRequest : GetQueryRequestBase
{
    public Guid? LinhaId { get; set; }
    public int? NumeroReferencia { get; set; }
}

public class ReferenciaPostResponse
{
    public Guid ReferenciaId { get; set; }
    public Guid LinhaId { get; set; }
    public Guid? CorId { get; set; }
    public int NumeroLinha { get; set; }
    public int NumeroReferencia { get; set; }
    public string CodigoReferencia { get; set; } = string.Empty;
    public string CodigoReferenciaCor { get; set; } = string.Empty;
    public string Sigla { get; set; } = string.Empty;
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
    public string? Observacao { get; set; }
    public List<ReferenciaCorResponse> Cores { get; set; } = [];
}

public class ReferenciaGetResponse
{
    public Guid ReferenciaId { get; set; }
    public Guid LinhaId { get; set; }
    public Guid? CorId { get; set; }
    public int NumeroLinha { get; set; }
    public int NumeroReferencia { get; set; }
    public string CodigoReferencia { get; set; } = string.Empty;
    public string CodigoReferenciaCor { get; set; } = string.Empty;
    public string Sigla { get; set; } = string.Empty;
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
    public string? Observacao { get; set; }
    public DateTime DataCriacao { get; set; }
    public List<ReferenciaCorResponse> Cores { get; set; } = [];
}

public class ReferenciaProximaResponse
{
    public Guid LinhaId { get; set; }
    public int NumeroLinha { get; set; }
    public int ProximaReferencia { get; set; }
    public string CodigoReferencia { get; set; } = string.Empty;
}

public class ReferenciaCor
{
    public Guid ReferenciaId { get; set; }

    [LogDescription("cor")]
    public Guid CorId { get; set; }
}

public class ReferenciaCorPostRequest
{
    public Guid CorId { get; set; }
}

public class ReferenciaCorResponse
{
    public Guid ReferenciaId { get; set; }
    public Guid CorId { get; set; }
    public string CodigoReferenciaCor { get; set; } = string.Empty;
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
}