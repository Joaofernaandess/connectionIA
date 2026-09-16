using Npgsql;
using System.Data;

namespace Pedido.Data.Repositories;

public static class DbConnectionFactory
{
    public static IDbConnection CriarPostgreSqlConnection(string connectionString)
    {
        return new NpgsqlConnection(connectionString);
    }
}
