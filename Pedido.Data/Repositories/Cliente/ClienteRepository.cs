using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Data;

namespace Pedido.Data.Repositories;

public class ClienteRepository : BaseRepository, IClienteRepository
{
    public ClienteRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Cliente cliente)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.cliente
            (
                cliente_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual
            )
            VALUES
            (
                @cliente_id,
                @razao_social,
                @fantasia,
                @cnpj,
                @inscricao_estadual
            )
            RETURNING cliente_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = cliente.ClienteId;
            cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = cliente.RazaoSocial;
            cmd.Parameters.Add("fantasia", NpgsqlDbType.Varchar).Value = cliente.Fantasia;
            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cliente.Cnpj);
            cmd.Parameters.Add("inscricao_estadual", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cliente.InscricaoEstadual);

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ClienteGetResponse>> Obter(ClienteGetRequest request)
    {
        var clientes = new List<ClienteGetResponse>();

        string sql = @"
            SELECT
                cliente_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual,
                COALESCE((
                    SELECT valor
                    FROM pedido_certo_ai.cliente_contato
                    WHERE cliente_id = cliente.cliente_id
                      AND tipo_contato = @tipo_contato_telefone
                    ORDER BY ""default"" DESC
                    LIMIT 1
                ), '') AS telefone
            FROM
                pedido_certo_ai.cliente
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(request.RazaoSocial)) sql += " AND razao_social ILIKE @razao_social";

        if (!string.IsNullOrWhiteSpace(request.Cnpj)) sql += " AND regexp_replace(cnpj, '\\D', '', 'g') ILIKE @cnpj";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "razao_social asc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = $"%{request.RazaoSocial ?? string.Empty}%";
            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = $"%{StringHelper.ObterApenasNumeros(request.Cnpj ?? string.Empty)}%";
            cmd.Parameters.Add("tipo_contato_telefone", NpgsqlDbType.Integer).Value = (int)TipoContato.Telefone;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                clientes.Add(new ClienteGetResponse
                {
                    ClienteId = reader.GetGuid("cliente_id"),
                    RazaoSocial = reader.GetString("razao_social"),
                    Fantasia = reader.GetString("fantasia"),
                    Cnpj = reader.GetString("cnpj"),
                    InscricaoEstadual = reader.GetString("inscricao_estadual"),
                    Telefone = reader.GetString("telefone")
                });
            }

            return clientes;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Cliente?> Obter(Guid clienteId)
    {
        const string sql = @"
            SELECT
                cliente_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual
            FROM
                pedido_certo_ai.cliente
            WHERE
                cliente_id = @cliente_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            var cliente = new Cliente
            {
                ClienteId = reader.GetGuid("cliente_id"),
                RazaoSocial = reader.GetString("razao_social"),
                Fantasia = reader.GetString("fantasia"),
                Cnpj = reader.GetString("cnpj"),
                InscricaoEstadual = reader.GetString("inscricao_estadual")
            };

            return cliente;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(Cliente cliente)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.cliente
            SET
                razao_social = @razao_social,
                fantasia = @fantasia,
                cnpj = @cnpj,
                inscricao_estadual = @inscricao_estadual
            WHERE
                cliente_id = @cliente_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = cliente.ClienteId;
            cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = cliente.RazaoSocial;
            cmd.Parameters.Add("fantasia", NpgsqlDbType.Varchar).Value = cliente.Fantasia;
            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cliente.Cnpj);
            cmd.Parameters.Add("inscricao_estadual", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cliente.InscricaoEstadual);

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<Cliente?> ObterPorCnpj(string cnpj)
    {
        const string sql = @"
            SELECT
                cliente_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual
            FROM
                pedido_certo_ai.cliente
            WHERE
                regexp_replace(cnpj, '\D', '', 'g') = @cnpj
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cnpj);

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return new Cliente
            {
                ClienteId = reader.GetGuid("cliente_id"),
                RazaoSocial = reader.GetString("razao_social"),
                Fantasia = reader.GetString("fantasia"),
                Cnpj = reader.GetString("cnpj"),
                InscricaoEstadual = reader.GetString("inscricao_estadual")
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarClienteExiste(string cnpj, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.cliente
            WHERE
                regexp_replace(cnpj, '\D', '', 'g') = @cnpj
            AND
                cliente_id <> @ignoreId
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cnpj);
            cmd.Parameters.Add("ignoreId", NpgsqlDbType.Uuid).Value = ignoreId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarClienteExiste(Guid clienteId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.cliente
            WHERE
                cliente_id = @cliente_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }
}
