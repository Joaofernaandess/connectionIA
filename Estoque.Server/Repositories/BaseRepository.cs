using Npgsql;
using System.Data;

namespace Estoque.Server.Repositories;

public class BaseRepository
{
    private readonly NpgsqlConnection _connection;

    public NpgsqlConnection Connection { get => _connection; }

    public BaseRepository(IDbConnection connection)
    {
        _connection = (NpgsqlConnection)connection ?? throw new ArgumentNullException(nameof(connection));
    }

    protected async Task EnsureOpenAsync()
    {
        if (_connection.State != ConnectionState.Open) await _connection.OpenAsync();
    }
}