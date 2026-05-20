using Estoque.Server.Validations;

namespace Estoque.Server.Services;

public class BaseService
{
    private List<ValidationError> _errors = new();

    public List<ValidationError> Errors { get => _errors; }

    protected void AddError(string field, string message)
    {
        _errors.Add(new ValidationError(field, message));
    }
}