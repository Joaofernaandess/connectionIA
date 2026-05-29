using Estoque.Server.Models;
using Estoque.Server.Utils;
using Npgsql;
using NpgsqlTypes;
using System.Data;

namespace Estoque.Server.Repositories;

public class HistoricoRepository : BaseRepository
{
    public HistoricoRepository(IDbConnection connection) : base(connection) { }

    public async Task<List<HistoricoRecuperado>> ObterHistoricoPorItem(Guid itemEstoqueId)
    {
        var historicos = new List<HistoricoRecuperado>();

        const string sql = @"
            SELECT
                historico_id,
                item_estoque_id,
                tipo_movimentacao,
                estoque_certo.historico.usuario_id,
                estoque_certo.usuario.nome AS nome,
                data_hora,
                quantidade_anterior,
                quantidade_resultante,
                espaco_origem_id,
                espaco_origem.nome AS espaco_origem_nome,
                espaco_destino_id,
                espaco_destino.nome AS espaco_destino_nome
            FROM
                estoque_certo.historico
            LEFT JOIN
                estoque_certo.usuario ON estoque_certo.historico.usuario_id = estoque_certo.usuario.usuario_id
            LEFT JOIN
                estoque_certo.espaco espaco_origem ON estoque_certo.historico.espaco_origem_id = espaco_origem.espaco_id
            LEFT JOIN
                estoque_certo.espaco espaco_destino ON estoque_certo.historico.espaco_destino_id = espaco_destino.espaco_id
            WHERE
                item_estoque_id = @item_estoque_id
            ORDER BY
                data_hora DESC;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("item_estoque_id", NpgsqlDbType.Uuid).Value = itemEstoqueId;

            await using var reader = await cmd.ExecuteReaderAsync();


            while (await reader.ReadAsync())
            {
                var historico = new HistoricoRecuperado();

                historico.HistoricoId = reader.GetGuid("historico_id");
                historico.ItemEstoqueId = reader.GetGuid("item_estoque_id");
                historico.TipoMovimentacao = (TipoMovimentacao)reader.GetInt32("tipo_movimentacao");
                historico.UsuarioId = reader.GetGuidNullable("usuario_id");
                historico.Nome = reader.GetStringNullable("nome");
                historico.DataHora = reader.GetDateTime(reader.GetOrdinal("data_hora"));
                historico.QuantidadeAnterior = reader.GetDecimal("quantidade_anterior");
                historico.QuantidadeResultante = reader.GetDecimal("quantidade_resultante");
                historico.EspacoOrigemId = reader.GetGuidNullable("espaco_origem_id");
                historico.EspacoOrigemNome = reader.GetStringNullable("espaco_origem_nome");
                historico.EspacoDestinoId = reader.GetGuidNullable("espaco_destino_id");
                historico.EspacoDestinoNome = reader.GetStringNullable("espaco_destino_nome");

                historicos.Add(historico);
            }

            return historicos;
        }
        catch
        {
            throw;
        }
    }

    public async Task InserirComTransacao(Historico historico, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO estoque_certo.historico
            (
                item_estoque_id,
                tipo_movimentacao,
                usuario_id,
                espaco_origem_id,
                espaco_destino_id,
                data_hora,
                quantidade_anterior,
                quantidade_resultante
            )
            VALUES
            (
                @item_estoque_id,
                @tipo_movimentacao,
                @usuario_id,
                @espaco_origem_id,
                @espaco_destino_id,
                @data_hora,
                @quantidade_anterior,
                @quantidade_resultante
            );
        ";

        await using var cmd = new NpgsqlCommand(sql, (NpgsqlConnection)transaction.Connection!, (NpgsqlTransaction)transaction);

        cmd.Parameters.Add("item_estoque_id", NpgsqlDbType.Uuid).Value = historico.ItemEstoqueId;
        cmd.Parameters.Add("tipo_movimentacao", NpgsqlDbType.Integer).Value = (int)historico.TipoMovimentacao;
        cmd.Parameters.Add("usuario_id", NpgsqlDbType.Uuid).Value = historico.UsuarioId.HasValue ? (object)historico.UsuarioId.Value : DBNull.Value;
        cmd.Parameters.Add("espaco_origem_id", NpgsqlDbType.Uuid).Value = historico.EspacoOrigemId.HasValue ? (object)historico.EspacoOrigemId.Value : DBNull.Value;
        cmd.Parameters.Add("espaco_destino_id", NpgsqlDbType.Uuid).Value = historico.EspacoDestinoId.HasValue ? (object)historico.EspacoDestinoId.Value : DBNull.Value;
        cmd.Parameters.Add("data_hora", NpgsqlDbType.Timestamp).Value = DateTimeHelper.SaoPaulo();
        cmd.Parameters.Add("quantidade_anterior", NpgsqlDbType.Numeric).Value = historico.QuantidadeAnterior;
        cmd.Parameters.Add("quantidade_resultante", NpgsqlDbType.Numeric).Value = historico.QuantidadeResultante;

        await cmd.ExecuteNonQueryAsync();
    }
}