using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Data;
using PedidoModel = Pedido.Domain.Models.Pedido;

namespace Pedido.Data.Repositories;

public class PedidoRepository : BaseRepository, IPedidoRepository
{
    public PedidoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> CadastrarPedido(PedidoModel pedido)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.pedido
            (
                pedido_id,
                pedido_link_id,
                usuario_id,
                status,
                data_criacao
            )
            VALUES
            (
                @pedido_id,
                @pedido_link_id,
                @usuario_id,
                @status,
                @data_criacao
            )
            RETURNING pedido_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedido.PedidoId;
            cmd.Parameters.Add("pedido_link_id", NpgsqlDbType.Varchar).Value = pedido.PedidoLinkId;
            cmd.Parameters.Add("usuario_id", NpgsqlDbType.Uuid).Value = pedido.UsuarioId ?? (object)DBNull.Value;
            cmd.Parameters.Add("status", NpgsqlDbType.Integer).Value = (int)pedido.Status;
            cmd.Parameters.Add("data_criacao", NpgsqlDbType.Timestamp).Value = DateTimeHelper.SaoPaulo();

            var result = await cmd.ExecuteScalarAsync();
            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<PedidoGetResponse>> Obter(PedidoGetRequest request)
    {
        var pedidos = new List<PedidoGetResponse>();

        string sql = @"
            SELECT
                pedido.pedido_id,
                pedido.pedido_link_id,
                pedido.usuario_id,
                pedido.cliente_id,
                pedido.fornecedor_id,
                agenda_info.agenda_id,
                agenda_info.data_programacao,
                COALESCE(NULLIF(BTRIM(cliente.razao_social), ''), 'Não interpretado') AS cliente_nome,
                COALESCE(NULLIF(BTRIM(fornecedor.razao_social), ''), 'Não interpretado') AS fornecedor_nome,
                pedido.numero_pedido,
                pedido.data_emissao,
                pedido.data_faturamento,
                pedido.condicao_pagamento,
                pedido.representante,
                pedido.percentual_desconto,
                pedido.total_pares,
                pedido.total_bruto,
                pedido.valor_desconto,
                pedido.total_liquido,
                pedido.observacoes,
                pedido.status,
                pedido.data_criacao
            FROM
                pedido_certo_ai.pedido
            LEFT JOIN
                pedido_certo_ai.cliente ON pedido.cliente_id = cliente.cliente_id
            LEFT JOIN
                pedido_certo_ai.fornecedor ON pedido.fornecedor_id = fornecedor.fornecedor_id
            LEFT JOIN LATERAL
            (
                SELECT
                    agenda.agenda_id,
                    agenda.data AS data_programacao
                FROM
                    pedido_certo_ai.programacao
                INNER JOIN
                    pedido_certo_ai.agenda ON agenda.agenda_id = programacao.agenda_id
                WHERE
                    programacao.pedido_id = pedido.pedido_id
                ORDER BY
                    agenda.data
                LIMIT 1
            ) agenda_info ON TRUE
            WHERE 1 = 1
        ";

        if (request.ClienteId != null) sql += " AND pedido.cliente_id = @cliente_id";

        if (!string.IsNullOrWhiteSpace(request.NumeroPedido)) sql += " AND pedido.numero_pedido ILIKE @numero_pedido";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "data_criacao desc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = request.ClienteId ?? (object)DBNull.Value;
            cmd.Parameters.Add("numero_pedido", NpgsqlDbType.Varchar).Value = $"%{request.NumeroPedido}%";
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                pedidos.Add(LerPedido(reader));

            return pedidos;
        }
        catch
        {
            throw;
        }
    }

    public async Task<PedidoGetResponse?> Obter(Guid pedidoId)
    {
        const string sql = @"
            SELECT
                pedido.pedido_id,
                pedido.pedido_link_id,
                pedido.usuario_id,
                pedido.cliente_id,
                pedido.fornecedor_id,
                agenda_info.agenda_id,
                agenda_info.data_programacao,
                COALESCE(NULLIF(BTRIM(cliente.razao_social), ''), 'Não interpretado') AS cliente_nome,
                COALESCE(NULLIF(BTRIM(fornecedor.razao_social), ''), 'Não interpretado') AS fornecedor_nome,
                pedido.numero_pedido,
                pedido.data_emissao,
                pedido.data_faturamento,
                pedido.condicao_pagamento,
                pedido.representante,
                pedido.percentual_desconto,
                pedido.total_pares,
                pedido.total_bruto,
                pedido.valor_desconto,
                pedido.total_liquido,
                pedido.observacoes,
                pedido.status,
                pedido.data_criacao
            FROM
                pedido_certo_ai.pedido
            LEFT JOIN
                pedido_certo_ai.cliente ON pedido.cliente_id = cliente.cliente_id
            LEFT JOIN
                pedido_certo_ai.fornecedor ON pedido.fornecedor_id = fornecedor.fornecedor_id
            LEFT JOIN LATERAL
            (
                SELECT
                    agenda.agenda_id,
                    agenda.data AS data_programacao
                FROM
                    pedido_certo_ai.programacao
                INNER JOIN
                    pedido_certo_ai.agenda ON agenda.agenda_id = programacao.agenda_id
                WHERE
                    programacao.pedido_id = pedido.pedido_id
                ORDER BY
                    agenda.data
                LIMIT 1
            ) agenda_info ON TRUE
            WHERE
                pedido.pedido_id = @pedido_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedidoId;

            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;

            return LerPedido(reader);
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(PedidoModel pedido)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.pedido
            SET
                cliente_id = @cliente_id,
                fornecedor_id = @fornecedor_id,
                numero_pedido = @numero_pedido,
                data_emissao = @data_emissao,
                data_faturamento = @data_faturamento,
                condicao_pagamento = @condicao_pagamento,
                representante = @representante,
                percentual_desconto = @percentual_desconto,
                total_pares = @total_pares,
                total_bruto = @total_bruto,
                valor_desconto = @valor_desconto,
                total_liquido = @total_liquido,
                observacoes = @observacoes,
                status = @status
            WHERE
                pedido_id = @pedido_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedido.PedidoId;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = pedido.ClienteId ?? (object)DBNull.Value;
            cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = pedido.FornecedorId ?? (object)DBNull.Value;
            cmd.Parameters.Add("numero_pedido", NpgsqlDbType.Varchar).Value = pedido.NumeroPedido;
            cmd.Parameters.Add("data_emissao", NpgsqlDbType.Timestamp).Value = pedido.DataEmissao ?? (object)DBNull.Value;
            cmd.Parameters.Add("data_faturamento", NpgsqlDbType.Timestamp).Value = pedido.DataFaturamento ?? (object)DBNull.Value;
            cmd.Parameters.Add("condicao_pagamento", NpgsqlDbType.Varchar).Value = pedido.CondicaoPagamento;
            cmd.Parameters.Add("representante", NpgsqlDbType.Varchar).Value = pedido.Representante;
            cmd.Parameters.Add("percentual_desconto", NpgsqlDbType.Numeric).Value = pedido.PercentualDesconto;
            cmd.Parameters.Add("total_pares", NpgsqlDbType.Integer).Value = pedido.TotalPares;
            cmd.Parameters.Add("total_bruto", NpgsqlDbType.Numeric).Value = pedido.TotalBruto;
            cmd.Parameters.Add("valor_desconto", NpgsqlDbType.Numeric).Value = pedido.ValorDesconto;
            cmd.Parameters.Add("total_liquido", NpgsqlDbType.Numeric).Value = pedido.TotalLiquido;
            cmd.Parameters.Add("observacoes", NpgsqlDbType.Varchar).Value = pedido.Observacoes;
            cmd.Parameters.Add("status", NpgsqlDbType.Integer).Value = (int)pedido.Status;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> AtualizarStatus(Guid pedidoId, PedidoStatus status)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.pedido
            SET
                status = @status
            WHERE
                pedido_id = @pedido_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedidoId;
            cmd.Parameters.Add("status", NpgsqlDbType.Integer).Value = (int)status;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    private static PedidoGetResponse LerPedido(IDataReader reader)
    {
        var agendaId = reader.GetGuidNullable("agenda_id");
        var dataProgramacao = reader.GetDateTimeNullable("data_programacao");
        var status = ObterStatus(reader.GetInt32Nullable("status"));

        return new PedidoGetResponse
        {
            PedidoId = reader.GetGuid("pedido_id"),
            PedidoLinkId = reader.GetStringNullable("pedido_link_id") ?? string.Empty,
            UsuarioId = reader.GetGuidNullable("usuario_id"),
            ClienteId = reader.GetGuidNullable("cliente_id"),
            FornecedorId = reader.GetGuidNullable("fornecedor_id"),
            AgendaId = agendaId,
            DataProgramacao = dataProgramacao,
            ClienteNome = reader.GetStringNullable("cliente_nome") ?? string.Empty,
            NumeroPedido = reader.GetStringNullable("numero_pedido") ?? string.Empty,
            DataEmissao = reader.GetDateTimeNullable("data_emissao"),
            DataFaturamento = reader.GetDateTimeNullable("data_faturamento"),
            CondicaoPagamento = reader.GetStringNullable("condicao_pagamento") ?? string.Empty,
            Representante = reader.GetStringNullable("representante") ?? string.Empty,
            Fornecedor = reader.GetStringNullable("fornecedor_nome") ?? string.Empty,
            PercentualDesconto = reader.GetDecimalNullable("percentual_desconto") ?? 0,
            TotalPares = reader.GetInt32Nullable("total_pares") ?? 0,
            TotalParesDescricao = ObterTotalParesDescricao(reader.GetInt32Nullable("total_pares") ?? 0),
            TotalBruto = reader.GetDecimalNullable("total_bruto") ?? 0,
            ValorDesconto = reader.GetDecimalNullable("valor_desconto") ?? 0,
            TotalLiquido = reader.GetDecimalNullable("total_liquido") ?? 0,
            Observacoes = reader.GetStringNullable("observacoes") ?? string.Empty,
            Status = NormalizarStatus(status, agendaId, dataProgramacao).ToString(),
            DataCriacao = reader.GetDateTimeNullable("data_criacao") ?? DateTime.MinValue
        };
    }

    private static PedidoStatus ObterStatus(int? status)
    {
        return status.HasValue && Enum.IsDefined(typeof(PedidoStatus), status.Value)
            ? (PedidoStatus)status.Value
            : PedidoStatus.AguardandoAnaliseIA;
    }

    private static string ObterTotalParesDescricao(int totalPares)
    {
        return totalPares > 0 ? totalPares.ToString() : "Não interpretado";
    }

    private static PedidoStatus NormalizarStatus(PedidoStatus status, Guid? agendaId, DateTime? dataProgramacao)
    {
        return status == PedidoStatus.Programado && (!agendaId.HasValue || !dataProgramacao.HasValue)
            ? PedidoStatus.PedidoProcessado
            : status;
    }
}
