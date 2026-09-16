namespace Pedido.Domain.Utils;

public class ValidationError
{
    public string Field { get; set; }
    public string Error { get; set; }

    public ValidationError(string field, string error)
    {
        Field = field;
        Error = error;
    }
}
