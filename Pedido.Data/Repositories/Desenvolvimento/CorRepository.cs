using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class CorRepository : BaseRepository, ICorRepository
{
    public CorRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Cor cor)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.cor
            (
                cor_id,
                cor_descricao,
                cor_codigo
            )
            VALUES
            (
                @cor_id,
                @cor_descricao,
                @cor_codigo
            )
            RETURNING cor_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = cor.CorId;
            cmd.Parameters.Add("cor_descricao", NpgsqlDbType.Varchar).Value = cor.CorDescricao;
            cmd.Parameters.Add("cor_codigo", NpgsqlDbType.Varchar).Value = cor.CorCodigo;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<CorGetResponse>> Obter(CorGetRequest request)
    {
        var cores = new List<CorGetResponse>();

        var sql = @"
            SELECT
                cor_id,
                cor_descricao,
                cor_codigo
            FROM
                pedido_certo_ai.cor
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(request.Pesquisa))
            sql += " AND (cor_descricao ILIKE @pesquisa OR cor_codigo ILIKE @pesquisa)";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "cor_descricao asc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pesquisa", NpgsqlDbType.Varchar).Value = $"%{request.Pesquisa?.Trim()}%";
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 50;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                cores.Add(new CorGetResponse
                {
                    CorId = reader.GetGuid("cor_id"),
                    CorDescricao = reader.GetString("cor_descricao"),
                    CorCodigo = reader.GetString("cor_codigo")
                });
            }

            return cores;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Cor?> Obter(Guid corId)
    {
        const string sql = @"
            SELECT
                cor_id,
                cor_descricao,
                cor_codigo
            FROM
                pedido_certo_ai.cor
            WHERE
                cor_id = @cor_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = corId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return new Cor
            {
                CorId = reader.GetGuid("cor_id"),
                CorDescricao = reader.GetString("cor_descricao"),
                CorCodigo = reader.GetString("cor_codigo")
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarCorExiste(Guid corId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.cor
            WHERE
                cor_id = @cor_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = corId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }
}