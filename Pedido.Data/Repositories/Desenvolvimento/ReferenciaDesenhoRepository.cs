using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class ReferenciaDesenhoRepository : BaseRepository, IReferenciaDesenhoRepository
{
    public ReferenciaDesenhoRepository(IDbConnection connection) : base(connection) { }

    public async Task<ReferenciaDesenhoResponse> Cadastrar(ReferenciaDesenho desenho)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.referencia_desenho
            (
                referencia_desenho_id,
                referencia_id,
                referencia_desenho_link_id,
                desenho_original
            )
            VALUES
            (
                @referencia_desenho_id,
                @referencia_id,
                @referencia_desenho_link_id,
                @desenho_original
            )
            RETURNING
                referencia_desenho_id,
                referencia_id,
                referencia_desenho_link_id,
                desenho_original;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_desenho_id", NpgsqlDbType.Uuid).Value = desenho.ReferenciaDesenhoId;
            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = desenho.ReferenciaId;
            cmd.Parameters.Add("referencia_desenho_link_id", NpgsqlDbType.Varchar).Value = desenho.ReferenciaDesenhoLinkId;
            cmd.Parameters.Add("desenho_original", NpgsqlDbType.Boolean).Value = desenho.DesenhoOriginal;

            await using var reader = await cmd.ExecuteReaderAsync();
            await reader.ReadAsync();

            return Mapear(reader);
        }
        catch
        {
            throw;
        }
    }

    public async Task<ReferenciaDesenhoResponse?> Obter(Guid referenciaDesenhoId)
    {
        const string sql = @"
            SELECT
                referencia_desenho_id,
                referencia_id,
                referencia_desenho_link_id,
                desenho_original
            FROM
                pedido_certo_ai.referencia_desenho
            WHERE
                referencia_desenho_id = @referencia_desenho_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_desenho_id", NpgsqlDbType.Uuid).Value = referenciaDesenhoId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return Mapear(reader);
        }
        catch
        {
            throw;
        }
    }

    public async Task<ReferenciaDesenhoResponse?> ObterDesenhoOriginal(Guid referenciaId)
    {
        const string sql = @"
            SELECT
                referencia_desenho_id,
                referencia_id,
                referencia_desenho_link_id,
                desenho_original
            FROM
                pedido_certo_ai.referencia_desenho
            WHERE
                referencia_id = @referencia_id
            AND
                desenho_original = true
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return Mapear(reader);
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ReferenciaDesenhoResponse>> ObterPorReferencia(Guid referenciaId)
    {
        var desenhos = new List<ReferenciaDesenhoResponse>();

        const string sql = @"
            SELECT
                referencia_desenho_id,
                referencia_id,
                referencia_desenho_link_id,
                desenho_original
            FROM
                pedido_certo_ai.referencia_desenho
            WHERE
                referencia_id = @referencia_id
            ORDER BY
                desenho_original DESC,
                referencia_desenho_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                desenhos.Add(Mapear(reader));
            }

            return desenhos;
        }
        catch
        {
            throw;
        }
    }

    private static ReferenciaDesenhoResponse Mapear(IDataReader reader)
    {
        return new ReferenciaDesenhoResponse
        {
            ReferenciaDesenhoId = reader.GetGuid("referencia_desenho_id"),
            ReferenciaId = reader.GetGuid("referencia_id"),
            ReferenciaDesenhoLinkId = reader.GetString("referencia_desenho_link_id"),
            DesenhoOriginal = reader.GetBoolean("desenho_original")
        };
    }
}
