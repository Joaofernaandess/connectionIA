using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class AuditoriaRepository : BaseRepository, IAuditoriaRepository
{
    public AuditoriaRepository(IDbConnection connection) : base(connection) { }

    public async Task<List<AuditoriaHistoricoResponse>> ObterHistorico(AuditoriaHistoricoGetRequest request)
    {
        var historico = new List<AuditoriaHistoricoResponse>();

        const string sql = @"
            WITH eventos_normalizados AS (
                SELECT
                    timestamp AS data,
                    message AS descricao,
                    COALESCE(
                        NULLIF(TRIM(BOTH '""' FROM properties ->> 'UsuarioNome'), ''),
                        NULLIF(TRIM(BOTH '""' FROM log_event -> 'Properties' ->> 'UsuarioNome'), ''),
                        NULLIF(TRIM(BOTH '""' FROM properties ->> 'Username'), ''),
                        NULLIF(TRIM(BOTH '""' FROM log_event -> 'Properties' ->> 'Username'), ''),
                        'Sistema'
                    ) AS usuario,
                    COALESCE(
                        NULLIF(TRIM(BOTH '""' FROM properties ->> 'Entidade'), ''),
                        NULLIF(TRIM(BOTH '""' FROM log_event -> 'Properties' ->> 'Entidade'), ''),
                        ''
                    ) AS entidade,
                    COALESCE(
                        NULLIF(TRIM(BOTH '""' FROM properties ->> 'EntidadeId'), ''),
                        NULLIF(TRIM(BOTH '""' FROM log_event -> 'Properties' ->> 'EntidadeId'), ''),
                        '00000000-0000-0000-0000-000000000000'
                    ) AS entidade_id
                FROM
                    auditoria.eventos
            )
            SELECT
                data,
                usuario,
                descricao,
                entidade,
                entidade_id
            FROM
                eventos_normalizados
            WHERE
                (
                    @referencia_id IS NOT NULL
                    AND entidade IN ('Referência', 'Referencia')
                    AND LOWER(entidade_id) = LOWER(@referencia_id)
                )
                OR
                (
                    @linha_id IS NOT NULL
                    AND entidade = 'Linha'
                    AND LOWER(entidade_id) = LOWER(@linha_id)
                )
            ORDER BY
                data DESC
            LIMIT @top OFFSET @skip;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Text).Value =
                request.ReferenciaId.HasValue ? request.ReferenciaId.Value.ToString() : DBNull.Value;
            cmd.Parameters.Add("linha_id", NpgsqlDbType.Text).Value =
                request.LinhaId.HasValue ? request.LinhaId.Value.ToString() : DBNull.Value;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 50;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                historico.Add(new AuditoriaHistoricoResponse
                {
                    Data = reader.GetDateTime("data"),
                    Usuario = reader.GetString("usuario"),
                    Descricao = reader.GetString("descricao"),
                    Entidade = reader.GetString("entidade"),
                    EntidadeId = Guid.TryParse(reader.GetString("entidade_id"), out var entidadeId)
                        ? entidadeId
                        : Guid.Empty
                });
            }

            return historico;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
        {
            return [];
        }
    }
}
