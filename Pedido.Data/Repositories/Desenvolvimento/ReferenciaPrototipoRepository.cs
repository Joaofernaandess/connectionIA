using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class ReferenciaPrototipoRepository : BaseRepository, IReferenciaPrototipoRepository
{
    public ReferenciaPrototipoRepository(IDbConnection connection) : base(connection) { }

    public async Task<ReferenciaPrototipoResponse> Cadastrar(ReferenciaPrototipo referenciaPrototipo)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.referencia_prototipo
            (
                referencia_prototipo_id,
                referencia_id,
                referencia_desenho_id,
                cor_id
            )
            VALUES
            (
                @referencia_prototipo_id,
                @referencia_id,
                @referencia_desenho_id,
                @cor_id
            )
            RETURNING
                referencia_prototipo_id,
                referencia_id,
                referencia_desenho_id,
                cor_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_prototipo_id", NpgsqlDbType.Uuid).Value = referenciaPrototipo.ReferenciaPrototipoId;
            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaPrototipo.ReferenciaId;
            cmd.Parameters.Add("referencia_desenho_id", NpgsqlDbType.Uuid).Value = referenciaPrototipo.ReferenciaDesenhoId;
            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = referenciaPrototipo.CorId;

            await using var reader = await cmd.ExecuteReaderAsync();
            await reader.ReadAsync();

            return Mapear(reader);
        }
        catch
        {
            throw;
        }
    }

    public async Task<ReferenciaPrototipoResponse?> ObterPorReferenciaCor(Guid referenciaId, Guid corId)
    {
        const string sql = @"
            SELECT
                referencia_prototipo_id,
                referencia_id,
                referencia_desenho_id,
                cor_id
            FROM
                pedido_certo_ai.referencia_prototipo
            WHERE
                referencia_id = @referencia_id
            AND
                cor_id = @cor_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;
            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = corId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return Mapear(reader);
        }
        catch
        {
            throw;
        }
    }

    private static ReferenciaPrototipoResponse Mapear(IDataReader reader)
    {
        return new ReferenciaPrototipoResponse
        {
            ReferenciaPrototipoId = reader.GetGuid("referencia_prototipo_id"),
            ReferenciaId = reader.GetGuid("referencia_id"),
            ReferenciaDesenhoId = reader.GetGuid("referencia_desenho_id"),
            CorId = reader.GetGuid("cor_id")
        };
    }
}
