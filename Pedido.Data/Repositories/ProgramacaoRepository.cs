using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class ProgramacaoRepository : BaseRepository, IProgramacaoRepository
{
    public ProgramacaoRepository(IDbConnection connection) : base(connection) { }

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

    private async Task Cadastrar(Guid agendaId, List<ProgramacaoItemRequest> programacoes, NpgsqlTransaction transaction)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.programacao
            (
                programacao_id,
                agenda_id,
                pedido_id,
                quantidade
            )
            VALUES
            (
                @programacao_id,
                @agenda_id,
                @pedido_id,
                @quantidade
            );
        ";

        try
        {
            await EnsureOpenAsync();

            foreach (var programacao in programacoes)
            {
                await using var cmd = new NpgsqlCommand(sql, Connection, transaction);
                cmd.Parameters.Add("programacao_id", NpgsqlDbType.Uuid).Value = Guid.NewGuid();
                cmd.Parameters.Add("agenda_id", NpgsqlDbType.Uuid).Value = agendaId;
                cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = programacao.PedidoId;
                cmd.Parameters.Add("quantidade", NpgsqlDbType.Integer).Value = programacao.Quantidade;

                await cmd.ExecuteNonQueryAsync();
            }
        }
        catch
        {
            throw;
        }
    }

    private async Task<List<Guid>> ExcluirPorPedidos(List<Guid> pedidosIds, NpgsqlTransaction transaction)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.programacao
            WHERE pedido_id = ANY(@pedidos_ids)
            RETURNING pedido_id;
        ";

        var pedidosRemovidosIds = new List<Guid>();

        try
        {
            if (!pedidosIds.Any())
                return pedidosRemovidosIds;

            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection, transaction);
            cmd.Parameters.Add("pedidos_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid).Value = pedidosIds.Distinct().ToList();

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                pedidosRemovidosIds.Add(reader.GetGuid("pedido_id"));

            return pedidosRemovidosIds;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ProgramacaoResponse>> ObterPorAgenda(Guid agendaId)
    {
        const string sql = @"
            SELECT
                programacao.programacao_id,
                programacao.agenda_id,
                programacao.pedido_id,
                pedido.numero_pedido,
                cliente.razao_social AS cliente_nome,
                programacao.quantidade,
                pedido.total_pares
            FROM
                pedido_certo_ai.programacao
            INNER JOIN
                pedido_certo_ai.pedido ON pedido.pedido_id = programacao.pedido_id
            LEFT JOIN
                pedido_certo_ai.cliente ON pedido.cliente_id = cliente.cliente_id
            WHERE
                programacao.agenda_id = @agenda_id
            ORDER BY
                pedido.numero_pedido;
        ";

        var programacoes = new List<ProgramacaoResponse>();

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("agenda_id", NpgsqlDbType.Uuid).Value = agendaId;

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                programacoes.Add(new ProgramacaoResponse
                {
                    ProgramacaoId = reader.GetGuid("programacao_id"),
                    AgendaId = reader.GetGuid("agenda_id"),
                    PedidoId = reader.GetGuid("pedido_id"),
                    NumeroPedido = reader.GetStringNullable("numero_pedido") ?? string.Empty,
                    ClienteNome = reader.GetStringNullable("cliente_nome") ?? string.Empty,
                    Quantidade = reader.GetInt32Nullable("quantidade") ?? 0,
                    TotalPares = reader.GetInt32Nullable("total_pares") ?? 0
                });
            }

            return programacoes;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<PedidoProgramacaoResumo>> ObterResumoPedidos(List<Guid> pedidosIds, List<Guid>? pedidosIgnoradosIds = null)
    {
        const string sql = @"
            SELECT
                pedido.pedido_id,
                pedido.numero_pedido,
                pedido.status,
                pedido.total_pares,
                COALESCE(SUM(programacao.quantidade) FILTER (
                    WHERE array_length(@pedidos_ignorados_ids, 1) IS NULL
                        OR programacao.pedido_id <> ALL(@pedidos_ignorados_ids)
                ), 0) AS quantidade_programada
            FROM
                pedido_certo_ai.pedido
            LEFT JOIN
                pedido_certo_ai.programacao ON programacao.pedido_id = pedido.pedido_id
            WHERE
                pedido.pedido_id = ANY(@pedidos_ids)
            GROUP BY
                pedido.pedido_id,
                pedido.numero_pedido,
                pedido.status,
                pedido.total_pares;
        ";

        var pedidos = new List<PedidoProgramacaoResumo>();

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("pedidos_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid).Value = pedidosIds;
            cmd.Parameters.Add("pedidos_ignorados_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid).Value =
                (pedidosIgnoradosIds ?? []).Distinct().ToArray();

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                pedidos.Add(new PedidoProgramacaoResumo
                {
                    PedidoId = reader.GetGuid("pedido_id"),
                    NumeroPedido = reader.GetStringNullable("numero_pedido") ?? string.Empty,
                    Status = ObterStatus(reader.GetInt32Nullable("status")),
                    TotalPares = reader.GetInt32Nullable("total_pares") ?? 0,
                    QuantidadeProgramada = reader.GetInt32Nullable("quantidade_programada") ?? 0
                });
            }

            return pedidos;
        }
        catch
        {
            throw;
        }
    }

    private static PedidoStatus ObterStatus(int? status)
    {
        return status.HasValue && Enum.IsDefined(typeof(PedidoStatus), status.Value)
            ? (PedidoStatus)status.Value
            : PedidoStatus.AguardandoAnaliseIA;
    }

    public async Task SalvarProgramacao(List<ProgramacaoAgendaRequest> agendas, List<Guid> pedidosIdsRemover)
    {
        try
        {
            await using var transaction = await BeginTransaction();

            try
            {
                var pedidosAfetadosIds = new List<Guid>();
                var pedidosSelecionadosIds = agendas
                    .SelectMany(agenda => agenda.Programacoes)
                    .Select(programacao => programacao.PedidoId)
                    .Concat(pedidosIdsRemover)
                    .Where(pedidoId => pedidoId != Guid.Empty)
                    .Distinct()
                    .ToList();

                var pedidosRemovidosIds = await ExcluirPorPedidos(pedidosSelecionadosIds, transaction);
                pedidosAfetadosIds.AddRange(pedidosRemovidosIds);

                foreach (var agenda in agendas)
                {
                    if (agenda.Programacoes.Any())
                        await Cadastrar(agenda.AgendaId, agenda.Programacoes, transaction);

                    pedidosAfetadosIds.AddRange(agenda.Programacoes.Select(programacao => programacao.PedidoId));
                }

                await AtualizarStatusPedidos(pedidosAfetadosIds, transaction);
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

    private async Task AtualizarStatusPedidos(List<Guid> pedidosIds, NpgsqlTransaction transaction)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.pedido
            SET
                status = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM pedido_certo_ai.programacao
                        WHERE programacao.pedido_id = pedido.pedido_id
                    ) THEN @status_programado
                    ELSE @status_processado
                END
            WHERE
                pedido_id = ANY(@pedidos_ids);
        ";

        try
        {
            if (!pedidosIds.Any())
                return;

            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection, transaction);
            cmd.Parameters.Add("pedidos_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid).Value = pedidosIds.Distinct().ToList();
            cmd.Parameters.Add("status_programado", NpgsqlDbType.Integer).Value = (int)PedidoStatus.Programado;
            cmd.Parameters.Add("status_processado", NpgsqlDbType.Integer).Value = (int)PedidoStatus.PedidoProcessado;

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }
}