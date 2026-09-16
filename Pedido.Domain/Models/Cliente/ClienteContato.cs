namespace Pedido.Domain.Models;

public class ClienteContato
{
    public Guid ClienteContatoId { get; set; }
    public Guid ClienteId { get; set; }
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
    public bool Default { get; set; }
}

public class ClienteContatoPostRequest
{
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
    public bool Default { get; set; }
}

public class ClienteContatoPutRequest
{
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
}

public class ClienteContatoValidacaoRequest : ClienteContatoPutRequest
{
    public Guid? ClienteContatoId { get; set; }
}
