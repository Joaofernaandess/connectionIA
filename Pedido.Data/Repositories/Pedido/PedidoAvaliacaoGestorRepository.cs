using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Data;

namespace Pedido.Data.Repositories;

public class PedidoAvaliacaoGestorRepository : BaseRepository, IPedidoAvaliacaoGestorRepository
{
    public PedidoAvaliacaoGestorRepository(IDbConnection connection) : base(connection) { }

    public async Task<int> Salvar(PedidoAvaliacaoGestor avaliacao)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.pedido_avaliacao_gestor
            (
                pedido_avaliacao_gestor_id,
                pedido_id,
                aprovado,
                nota,
                motivo,
                prompt,
                solicita_revisao,
                data_avaliacao
            )
            VALUES
            (
                @pedido_avaliacao_gestor_id,
                @pedido_id,
                @aprovado,
                @nota,
                @motivo,
                @prompt,
                @solicita_revisao,
                @data_avaliacao
            );
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_avaliacao_gestor_id", NpgsqlDbType.Uuid).Value = avaliacao.PedidoAvaliacaoGestorId;
            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = avaliacao.PedidoId;
            cmd.Parameters.Add("aprovado", NpgsqlDbType.Boolean).Value = avaliacao.Aprovado;
            cmd.Parameters.Add("nota", NpgsqlDbType.Integer).Value = avaliacao.Nota;
            cmd.Parameters.Add("motivo", NpgsqlDbType.Varchar).Value =
                string.IsNullOrWhiteSpace(avaliacao.Motivo) ? (object)DBNull.Value : avaliacao.Motivo;
            cmd.Parameters.Add("prompt", NpgsqlDbType.Varchar).Value =
                string.IsNullOrWhiteSpace(avaliacao.Prompt) ? (object)DBNull.Value : avaliacao.Prompt;
            cmd.Parameters.Add("solicita_revisao", NpgsqlDbType.Boolean).Value = avaliacao.SolicitaRevisao;
            cmd.Parameters.Add("data_avaliacao", NpgsqlDbType.Timestamp).Value = avaliacao.DataAvaliacao;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<PedidoAvaliacaoGestorGetResponse?> Obter(Guid pedidoId)
    {
        const string sql = @"
            SELECT
                pedido_avaliacao_gestor_id,
                pedido_id,
                aprovado,
                nota,
                motivo,
                prompt,
                solicita_revisao,
                data_avaliacao
            FROM
                pedido_certo_ai.pedido_avaliacao_gestor
            WHERE
                pedido_id = @pedido_id
            ORDER BY
                data_avaliacao DESC,
                pedido_avaliacao_gestor_id DESC
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedidoId;

            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;

            return LerAvaliacaoGestor(reader);
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> AtualizarPrompt(Guid pedidoId, Guid pedidoAvaliacaoGestorId, string prompt)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.pedido_avaliacao_gestor
            SET
                prompt = @prompt
            WHERE
                pedido_id = @pedido_id
            AND
                pedido_avaliacao_gestor_id = @pedido_avaliacao_gestor_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedidoId;
            cmd.Parameters.Add("pedido_avaliacao_gestor_id", NpgsqlDbType.Uuid).Value = pedidoAvaliacaoGestorId;
            cmd.Parameters.Add("prompt", NpgsqlDbType.Varchar).Value =
                string.IsNullOrWhiteSpace(prompt) ? (object)DBNull.Value : prompt;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<string>> ObterPromptsPorClienteCnpj(string cnpj)
    {
        var prompts = new List<string>();

        const string sql = @"
            SELECT
                avaliacao.prompt
            FROM
                pedido_certo_ai.pedido_avaliacao_gestor avaliacao
            INNER JOIN
                pedido_certo_ai.pedido pedido
                    ON pedido.pedido_id = avaliacao.pedido_id
            INNER JOIN
                pedido_certo_ai.cliente cliente
                    ON cliente.cliente_id = pedido.cliente_id
            WHERE
                regexp_replace(cliente.cnpj, '\D', '', 'g') = @cnpj
                AND avaliacao.prompt IS NOT NULL
                AND BTRIM(avaliacao.prompt) <> ''
            ORDER BY
                avaliacao.data_avaliacao DESC,
                avaliacao.pedido_avaliacao_gestor_id DESC;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value =
                StringHelper.ObterApenasNumeros(cnpj);

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
                prompts.Add(reader.GetString("prompt"));

            return prompts;
        }
        catch
        {
            throw;
        }
    }

    private static PedidoAvaliacaoGestorGetResponse LerAvaliacaoGestor(IDataReader reader)
    {
        return new PedidoAvaliacaoGestorGetResponse
        {
            PedidoAvaliacaoGestorId = reader.GetGuid("pedido_avaliacao_gestor_id"),
            PedidoId = reader.GetGuid("pedido_id"),
            Aprovado = reader.GetBoolean("aprovado"),
            Nota = reader.GetInt32("nota"),
            Motivo = reader.GetStringNullable("motivo") ?? string.Empty,
            Prompt = reader.GetStringNullable("prompt") ?? string.Empty,
            SolicitaRevisao = reader.GetBoolean("solicita_revisao"),
            DataAvaliacao = reader.GetDateTime("data_avaliacao")
        };
    }
}
