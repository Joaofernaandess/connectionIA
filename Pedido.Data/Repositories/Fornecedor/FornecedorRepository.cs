using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Data;

namespace Pedido.Data.Repositories;

public class FornecedorRepository : BaseRepository, IFornecedorRepository
{
    public FornecedorRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Fornecedor fornecedor)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.fornecedor
            (
                fornecedor_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual
            )
            VALUES
            (
                @fornecedor_id,
                @razao_social,
                @fantasia,
                @cnpj,
                @inscricao_estadual
            )
            RETURNING fornecedor_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedor.FornecedorId;
        cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = fornecedor.RazaoSocial;
        cmd.Parameters.Add("fantasia", NpgsqlDbType.Varchar).Value = fornecedor.Fantasia;
        cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(fornecedor.Cnpj);
        cmd.Parameters.Add("inscricao_estadual", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(fornecedor.InscricaoEstadual);

        var result = await cmd.ExecuteScalarAsync();

        return (Guid)result!;
    }

    public async Task<List<FornecedorGetResponse>> Obter(FornecedorGetRequest request)
    {
        var fornecedores = new List<FornecedorGetResponse>();

        string sql = @"
            SELECT
                fornecedor_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual,
                COALESCE((
                    SELECT valor
                    FROM pedido_certo_ai.fornecedor_contato
                    WHERE fornecedor_id = fornecedor.fornecedor_id
                      AND tipo_contato = @tipo_contato_telefone
                    ORDER BY ""default"" DESC
                    LIMIT 1
                ), '') AS telefone
            FROM
                pedido_certo_ai.fornecedor
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(request.RazaoSocial)) sql += " AND razao_social ILIKE @razao_social";

        if (!string.IsNullOrWhiteSpace(request.Cnpj)) sql += " AND regexp_replace(cnpj, '\\D', '', 'g') ILIKE @cnpj";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "razao_social asc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

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
            fornecedores.Add(new FornecedorGetResponse
            {
                FornecedorId = reader.GetGuid("fornecedor_id"),
                RazaoSocial = reader.GetString("razao_social"),
                Fantasia = reader.GetString("fantasia"),
                Cnpj = reader.GetString("cnpj"),
                InscricaoEstadual = reader.GetString("inscricao_estadual"),
                Telefone = reader.GetString("telefone")
            });
        }

        return fornecedores;
    }

    public async Task<Fornecedor?> Obter(Guid fornecedorId)
    {
        const string sql = @"
            SELECT
                fornecedor_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual
            FROM
                pedido_certo_ai.fornecedor
            WHERE
                fornecedor_id = @fornecedor_id
            LIMIT 1;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync()) return null;

        return new Fornecedor
        {
            FornecedorId = reader.GetGuid("fornecedor_id"),
            RazaoSocial = reader.GetString("razao_social"),
            Fantasia = reader.GetString("fantasia"),
            Cnpj = reader.GetString("cnpj"),
            InscricaoEstadual = reader.GetString("inscricao_estadual")
        };
    }

    public async Task<int> Atualizar(Fornecedor fornecedor)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.fornecedor
            SET
                razao_social = @razao_social,
                fantasia = @fantasia,
                cnpj = @cnpj,
                inscricao_estadual = @inscricao_estadual
            WHERE
                fornecedor_id = @fornecedor_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedor.FornecedorId;
        cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = fornecedor.RazaoSocial;
        cmd.Parameters.Add("fantasia", NpgsqlDbType.Varchar).Value = fornecedor.Fantasia;
        cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(fornecedor.Cnpj);
        cmd.Parameters.Add("inscricao_estadual", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(fornecedor.InscricaoEstadual);

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<Fornecedor?> ObterPorCnpj(string cnpj)
    {
        const string sql = @"
            SELECT
                fornecedor_id,
                razao_social,
                fantasia,
                cnpj,
                inscricao_estadual
            FROM
                pedido_certo_ai.fornecedor
            WHERE
                regexp_replace(cnpj, '\D', '', 'g') = @cnpj
            LIMIT 1;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cnpj);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync()) return null;

        return new Fornecedor
        {
            FornecedorId = reader.GetGuid("fornecedor_id"),
            RazaoSocial = reader.GetString("razao_social"),
            Fantasia = reader.GetString("fantasia"),
            Cnpj = reader.GetString("cnpj"),
            InscricaoEstadual = reader.GetString("inscricao_estadual")
        };
    }

    public async Task<bool> VerificarFornecedorExiste(string cnpj, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.fornecedor
            WHERE
                regexp_replace(cnpj, '\D', '', 'g') = @cnpj
            AND
                fornecedor_id <> @ignoreId
            LIMIT 1;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = StringHelper.ObterApenasNumeros(cnpj);
        cmd.Parameters.Add("ignoreId", NpgsqlDbType.Uuid).Value = ignoreId;

        var result = await cmd.ExecuteScalarAsync();

        return result != null;
    }

    public async Task<bool> VerificarFornecedorExiste(Guid fornecedorId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.fornecedor
            WHERE
                fornecedor_id = @fornecedor_id
            LIMIT 1;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;

        var result = await cmd.ExecuteScalarAsync();

        return result != null;
    }
}
