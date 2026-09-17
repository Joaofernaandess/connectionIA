namespace Pedido.Domain.Models;

public class Cor
{
    public Guid CorId { get; set; }
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
}

public class CorPostRequest
{
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
}

public class CorPostResponse
{
    public Guid CorId { get; set; }
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
}

public class CorGetRequest : GetQueryRequestBase
{
    public string? Pesquisa { get; set; }
}

public class CorGetResponse
{
    public Guid CorId { get; set; }
    public string CorDescricao { get; set; } = string.Empty;
    public string CorCodigo { get; set; } = string.Empty;
}
