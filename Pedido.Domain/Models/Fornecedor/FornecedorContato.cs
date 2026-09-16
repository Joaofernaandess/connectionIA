namespace Pedido.Domain.Models;

public class FornecedorContato
{
    public Guid FornecedorContatoId { get; set; }
    public Guid FornecedorId { get; set; }
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
    public bool Default { get; set; }
}

public class FornecedorContatoPostRequest
{
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
    public bool Default { get; set; }
}

public class FornecedorContatoPutRequest
{
    public TipoContato TipoContato { get; set; }
    public string Valor { get; set; } = string.Empty;
}

public class FornecedorContatoValidacaoRequest : FornecedorContatoPutRequest
{
    public Guid? FornecedorContatoId { get; set; }
}