using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class PedidoItemRepository : BaseRepository, IPedidoItemRepository
{
    public PedidoItemRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(PedidoItem item)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.pedido_item
            (
                pedido_item_id,
                pedido_id,
                sequencia,
                referencia,
                material_cor,
                quantidade,
                valor_unitario,
                valor_total
            )
            VALUES
            (
                @pedido_item_id,
                @pedido_id,
                @sequencia,
                @referencia,
                @material_cor,
                @quantidade,
                @valor_unitario,
                @valor_total
            )
            RETURNING pedido_item_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_item_id", NpgsqlDbType.Uuid).Value = item.PedidoItemId;
            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = item.PedidoId;
            cmd.Parameters.Add("sequencia", NpgsqlDbType.Integer).Value = item.Sequencia;
            cmd.Parameters.Add("referencia", NpgsqlDbType.Varchar).Value = item.Referencia;
            cmd.Parameters.Add("material_cor", NpgsqlDbType.Varchar).Value = item.MaterialCor;
            cmd.Parameters.Add("quantidade", NpgsqlDbType.Integer).Value = item.Quantidade;
            cmd.Parameters.Add("valor_unitario", NpgsqlDbType.Numeric).Value = item.ValorUnitario;
            cmd.Parameters.Add("valor_total", NpgsqlDbType.Numeric).Value = item.ValorTotal;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Guid> CadastrarGrade(PedidoItemGrade grade)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.pedido_item_grade
            (
                pedido_item_grade_id,
                pedido_item_id,
                numeracao,
                quantidade
            )
            VALUES
            (
                @pedido_item_grade_id,
                @pedido_item_id,
                @numeracao,
                @quantidade
            )
            RETURNING pedido_item_grade_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_item_grade_id", NpgsqlDbType.Uuid).Value = grade.PedidoItemGradeId;
            cmd.Parameters.Add("pedido_item_id", NpgsqlDbType.Uuid).Value = grade.PedidoItemId;
            cmd.Parameters.Add("numeracao", NpgsqlDbType.Varchar).Value = grade.Numeracao;
            cmd.Parameters.Add("quantidade", NpgsqlDbType.Integer).Value = grade.Quantidade;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<PedidoItemGetResponse>> Obter(Guid pedidoId)
    {
        const string sql = @"
            SELECT
                pedido_item_id,
                pedido_id,
                sequencia,
                referencia,
                material_cor,
                quantidade,
                valor_unitario,
                valor_total
            FROM
                pedido_certo_ai.pedido_item
            WHERE
                pedido_id = @pedido_id
            ORDER BY
                sequencia,
                referencia;
        ";

        var itens = new List<PedidoItemGetResponse>();

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedidoId;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
                itens.Add(LerItem(reader));

            await reader.CloseAsync();

            foreach (var item in itens)
                item.Grades = await ObterGrades(item.PedidoItemId);

            return itens;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Excluir(Guid pedidoId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.pedido_item
            WHERE pedido_id = @pedido_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_id", NpgsqlDbType.Uuid).Value = pedidoId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    private async Task<List<PedidoItemGrade>> ObterGrades(Guid pedidoItemId)
    {
        const string sql = @"
            SELECT
                pedido_item_grade_id,
                pedido_item_id,
                numeracao,
                quantidade
            FROM
                pedido_certo_ai.pedido_item_grade
            WHERE
                pedido_item_id = @pedido_item_id
            ORDER BY
                numeracao;
        ";

        var grades = new List<PedidoItemGrade>();

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pedido_item_id", NpgsqlDbType.Uuid).Value = pedidoItemId;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                grades.Add(new PedidoItemGrade
                {
                    PedidoItemGradeId = reader.GetGuid("pedido_item_grade_id"),
                    PedidoItemId = reader.GetGuid("pedido_item_id"),
                    Numeracao = reader.GetString("numeracao"),
                    Quantidade = reader.GetInt32("quantidade")
                });
            }

            return grades;
        }
        catch
        {
            throw;
        }
    }

    private static PedidoItemGetResponse LerItem(IDataReader reader)
    {
        return new PedidoItemGetResponse
        {
            PedidoItemId = reader.GetGuid("pedido_item_id"),
            PedidoId = reader.GetGuid("pedido_id"),
            Sequencia = reader.GetInt32("sequencia"),
            Referencia = reader.GetString("referencia"),
            MaterialCor = reader.GetString("material_cor"),
            Quantidade = reader.GetInt32("quantidade"),
            ValorUnitario = reader.GetDecimal("valor_unitario"),
            ValorTotal = reader.GetDecimal("valor_total")
        };
    }
}
