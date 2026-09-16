using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class BaseService
{
    private readonly List<ValidationError> _errors = new();

    public List<ValidationError> Errors => _errors;

    protected void AddError(string field, string message)
    {
        _errors.Add(new ValidationError(field, message));
    }
}