using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Data;

namespace Pedido.Data.Repositories;

public class AgendaRepository : BaseRepository, IAgendaRepository
{
    public AgendaRepository(IDbConnection connection) : base(connection) { }

    private async Task<NpgsqlTransaction> BeginTransaction()
    {
        try
        {
            await EnsureOpenAsync();
            return await Connection.BeginTransactionAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task Cadastrar(List<AgendaItem> agendaItems)
    {
        const string deleteSql = @"
            DELETE FROM
                pedido_certo_ai.agenda
            WHERE
                data = ANY(@datas);
        ";

        const string sql = @"
            INSERT INTO pedido_certo_ai.agenda
            (
                data,
                util,
                motivo,
                data_criacao
            )
            VALUES
            (
                @data,
                @util,
                @motivo,
                @data_criacao
            );
        ";

        var agendaItemsPorData = agendaItems
            .GroupBy(agendaItem => agendaItem.Data.Date)
            .Select(grupo => grupo.Last())
            .ToList();

        try
        {
            await EnsureOpenAsync();
            await using var transaction = await BeginTransaction();

            try
            {
                await using var deleteCmd = new NpgsqlCommand(deleteSql, Connection, transaction);
                deleteCmd.Parameters.Add("datas", NpgsqlDbType.Array | NpgsqlDbType.Date).Value = agendaItemsPorData
                    .Select(agendaItem => agendaItem.Data.Date)
                    .ToArray();

                await deleteCmd.ExecuteNonQueryAsync();

                foreach (var agendaItem in agendaItemsPorData)
                {
                    await using var cmd = new NpgsqlCommand(sql, Connection, transaction);
                    cmd.Parameters.Add("data", NpgsqlDbType.Date).Value = agendaItem.Data.Date;
                    cmd.Parameters.Add("util", NpgsqlDbType.Boolean).Value = agendaItem.Util;
                    cmd.Parameters.Add("motivo", NpgsqlDbType.Varchar).Value = string.IsNullOrWhiteSpace(agendaItem.Motivo) ? (object)DBNull.Value : agendaItem.Motivo.Trim();
                    cmd.Parameters.Add("data_criacao", NpgsqlDbType.Timestamp).Value = DateTimeHelper.SaoPaulo();

                    await cmd.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(Guid agendaId, DateTime data, bool util, string motivo)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.agenda
            SET
                data = @data,
                util = @util,
                motivo = @motivo
            WHERE
                agenda_id = @agenda_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var transaction = await BeginTransaction();

            try
            {
                await using var cmd = new NpgsqlCommand(sql, Connection, transaction);
                cmd.Parameters.Add("agenda_id", NpgsqlDbType.Uuid).Value = agendaId;
                cmd.Parameters.Add("data", NpgsqlDbType.Date).Value = data.Date;
                cmd.Parameters.Add("util", NpgsqlDbType.Boolean).Value = util;
                cmd.Parameters.Add("motivo", NpgsqlDbType.Varchar).Value = string.IsNullOrWhiteSpace(motivo) ? (object)DBNull.Value : motivo.Trim();

                var affected = await cmd.ExecuteNonQueryAsync();
                await transaction.CommitAsync();

                return affected;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<AgendaResponse>> ObterAgenda()
    {
        const string sql = @"
            SELECT
                agenda.agenda_id,
                agenda.data,
                agenda.util,
                agenda.motivo,
                programacao.programacao_id,
                pedido.pedido_id,
                pedido.numero_pedido,
                cliente.razao_social AS cliente_nome,
                COALESCE(programacao.quantidade, 0) AS quantidade,
                pedido.total_pares,
                pedido.total_bruto,
                pedido.total_liquido
            FROM
                pedido_certo_ai.agenda
            LEFT JOIN
                pedido_certo_ai.programacao ON programacao.agenda_id = agenda.agenda_id
            LEFT JOIN
                pedido_certo_ai.pedido ON pedido.pedido_id = programacao.pedido_id
            LEFT JOIN
                pedido_certo_ai.cliente ON pedido.cliente_id = cliente.cliente_id
            ORDER BY
                agenda.data,
                pedido.numero_pedido;
        ";

        try
        {
            return await ObterPorSql(sql);
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<AgendaResponse>> Obter(Guid agendaId)
    {
        const string sql = @"
            SELECT
                agenda.agenda_id,
                agenda.data,
                agenda.util,
                agenda.motivo,
                programacao.programacao_id,
                pedido.pedido_id,
                pedido.numero_pedido,
                cliente.razao_social AS cliente_nome,
                COALESCE(programacao.quantidade, 0) AS quantidade,
                pedido.total_pares,
                pedido.total_bruto,
                pedido.total_liquido
            FROM
                pedido_certo_ai.agenda
            LEFT JOIN
                pedido_certo_ai.programacao ON programacao.agenda_id = agenda.agenda_id
            LEFT JOIN
                pedido_certo_ai.pedido ON pedido.pedido_id = programacao.pedido_id
            LEFT JOIN
                pedido_certo_ai.cliente ON pedido.cliente_id = cliente.cliente_id
            WHERE
                agenda.agenda_id = @agenda_id
            ORDER BY
                pedido.numero_pedido;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("agenda_id", NpgsqlDbType.Uuid).Value = agendaId;

            return await LerAgendas(cmd);
        }
        catch
        {
            throw;
        }
    }

    private async Task<List<AgendaResponse>> ObterPorSql(string sql)
    {
        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);
        return await LerAgendas(cmd);
    }

    private static async Task<List<AgendaResponse>> LerAgendas(NpgsqlCommand cmd)
    {
        var agendas = new List<AgendaResponse>();

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            agendas.Add(LerAgenda(reader));

        return agendas;
    }

    private static AgendaResponse LerAgenda(IDataReader reader)
    {
        var quantidade = reader.GetInt32Nullable("quantidade") ?? 0;

        return new AgendaResponse
        {
            AgendaId = reader.GetGuid("agenda_id"),
            Data = reader.GetDateTime("data"),
            Util = reader.GetBoolean("util"),
            Motivo = reader.GetStringNullable("motivo") ?? string.Empty,
            Metrica = quantidade,
            ProgramacaoId = reader.GetGuidNullable("programacao_id"),
            PedidoId = reader.GetGuidNullable("pedido_id"),
            NumeroPedido = reader.GetStringNullable("numero_pedido") ?? string.Empty,
            ClienteNome = reader.GetStringNullable("cliente_nome") ?? string.Empty,
            Quantidade = quantidade,
            TotalPares = reader.GetInt32Nullable("total_pares") ?? 0,
            TotalBruto = reader.GetDecimalNullable("total_bruto") ?? 0,
            TotalLiquido = reader.GetDecimalNullable("total_liquido") ?? 0
        };
    }
}