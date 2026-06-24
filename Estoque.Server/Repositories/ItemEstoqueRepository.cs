using Estoque.Server.Models;
using Npgsql;
using NpgsqlTypes;
using System.Data;

namespace Estoque.Server.Repositories;

public class ItemEstoqueRepository : BaseRepository
{
    public ItemEstoqueRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(ItemEstoque item)
    {
        const string sql = @"
            INSERT INTO estoque_certo.item_estoque
            (
                unidade_organizacional_id,
                espaco_id,
                descricao,
                tipo_unidade_medida,
                quantidade
            )
            VALUES
            (
                @unidade_organizacional_id,
                @espaco_id,
                @descricao,
                @tipo_unidade_medida,
                @quantidade
            )
            RETURNING item_estoque_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = item.UnidadeOrganizacionalId;
            cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = item.EspacoId;
            cmd.Parameters.Add("descricao", NpgsqlDbType.Varchar).Value = item.Descricao;
            cmd.Parameters.Add("tipo_unidade_medida", NpgsqlDbType.Integer).Value = (int)item.TipoUnidadeMedida;
            cmd.Parameters.Add("quantidade", NpgsqlDbType.Numeric).Value = item.Quantidade;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> AtualizarItemEstoque(ItemEstoque item, Guid itemEstoqueId)
    {
        const string sql = @"
            UPDATE
                estoque_certo.item_estoque
            SET
                espaco_id = @espaco_id,
                descricao = @descricao,
                tipo_unidade_medida = @tipo_unidade_medida,
                quantidade = @quantidade
            WHERE
                item_estoque_id = @id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("id", NpgsqlDbType.Uuid).Value = itemEstoqueId;
            cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = item.EspacoId;
            cmd.Parameters.Add("descricao", NpgsqlDbType.Varchar).Value = item.Descricao;
            cmd.Parameters.Add("tipo_unidade_medida", NpgsqlDbType.Integer).Value = (int)item.TipoUnidadeMedida;
            cmd.Parameters.Add("quantidade", NpgsqlDbType.Numeric).Value = item.Quantidade;
            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ItemEstoqueRecuperado>> Obter(int skip, int top, string? descricao, Guid? unidadeOrganizacionalId, Guid? espacoId)
    {
        var itens = new List<ItemEstoqueRecuperado>();

        string sql = @"
            SELECT
                item_estoque_id,
                unidade_organizacional_id,
                espaco_id,
                descricao,
                tipo_unidade_medida,
                quantidade
            FROM
                estoque_certo.item_estoque
            WHERE 1 = 1
        ";

        if (!string.IsNullOrEmpty(descricao)) sql += " AND descricao ILIKE @descricao";

        if (unidadeOrganizacionalId != null) sql += " AND unidade_organizacional_id = @unidade_organizacional_id";

        if (espacoId != null) sql += " AND espaco_id = @espaco_id";

        sql += " ORDER BY descricao LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("descricao", NpgsqlTypes.NpgsqlDbType.Varchar).Value = $"%{descricao}%";
            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId ?? (object)DBNull.Value;
            cmd.Parameters.Add("espaco_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = espacoId ?? (object)DBNull.Value;
            cmd.Parameters.Add("top", NpgsqlTypes.NpgsqlDbType.Integer).Value = top;
            cmd.Parameters.Add("skip", NpgsqlTypes.NpgsqlDbType.Integer).Value = skip;

            await using var reader = await cmd.ExecuteReaderAsync();


            while (await reader.ReadAsync())
            {
                var itemEstoqueRecuperado = new ItemEstoqueRecuperado();

                itemEstoqueRecuperado.ItemEstoqueId = reader.GetGuid("item_estoque_id");
                itemEstoqueRecuperado.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
                itemEstoqueRecuperado.EspacoId = reader.GetGuid("espaco_id");
                itemEstoqueRecuperado.Descricao = reader.GetString("descricao");
                itemEstoqueRecuperado.TipoUnidadeMedida = (TipoUnidadeMedida)reader.GetInt32("tipo_unidade_medida");
                itemEstoqueRecuperado.Quantidade = reader.GetDecimal("quantidade");

                itens.Add(itemEstoqueRecuperado);
            }

            return itens;
        }
        catch
        {
            throw;
        }
    }

    public async Task<ItemEstoqueRecuperado?> Obter(Guid itemEstoqueId)
    {
        const string sql = @"
            SELECT
                item_estoque_id,
                unidade_organizacional_id,
                espaco_id,
                descricao,
                tipo_unidade_medida,
                quantidade
            FROM
                estoque_certo.item_estoque
            WHERE
                item_estoque_id = @id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("id", NpgsqlDbType.Uuid).Value = itemEstoqueId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            var itemEstoqueRecuperado = new ItemEstoqueRecuperado();

            itemEstoqueRecuperado.ItemEstoqueId = reader.GetGuid("item_estoque_id");
            itemEstoqueRecuperado.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
            itemEstoqueRecuperado.EspacoId = reader.GetGuid("espaco_id");
            itemEstoqueRecuperado.Descricao = reader.GetString("descricao");
            itemEstoqueRecuperado.TipoUnidadeMedida = (TipoUnidadeMedida)reader.GetInt32("tipo_unidade_medida");
            itemEstoqueRecuperado.Quantidade = reader.GetDecimal("quantidade");

            return itemEstoqueRecuperado;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarItemExiste(string descricao, Guid espacoId, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                estoque_certo.item_estoque
            WHERE
                descricao = @descricao
            AND
                espaco_id = @espaco_id
            AND
                item_estoque_id <> @item_estoque_id
            LIMIT 1;
        ";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("descricao", NpgsqlDbType.Varchar).Value = descricao;
        cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = espacoId;
        cmd.Parameters.Add("item_estoque_id", NpgsqlDbType.Uuid).Value = ignoreId;

        var result = await cmd.ExecuteScalarAsync();

        return result != null;
    }

    public async Task<int> Excluir(Guid itemEstoqueId)
    {
        const string sql = "DELETE FROM estoque_certo.item_estoque WHERE item_estoque_id = @id";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("id", NpgsqlDbType.Uuid).Value = itemEstoqueId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<ItemEstoqueRecuperado?> ObterParaAtualizacao(Guid itemEstoqueId, IDbTransaction transaction)
    {
        const string sql = @"
            SELECT
                item_estoque_id,
                unidade_organizacional_id,
                espaco_id,
                descricao,
                tipo_unidade_medida,
                quantidade
            FROM
                estoque_certo.item_estoque
            WHERE
                item_estoque_id = @id
            FOR UPDATE;
        ";

        await using var cmd = new NpgsqlCommand(sql, (NpgsqlConnection)transaction.Connection!, (NpgsqlTransaction)transaction);
        cmd.Parameters.Add("id", NpgsqlDbType.Uuid).Value = itemEstoqueId;

        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            var item = new ItemEstoqueRecuperado();

            item.ItemEstoqueId = reader.GetGuid("item_estoque_id");
            item.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
            item.EspacoId = reader.GetGuid("espaco_id");
            item.Descricao = reader.GetString("descricao");
            item.TipoUnidadeMedida = (TipoUnidadeMedida)reader.GetInt32("tipo_unidade_medida");
            item.Quantidade = reader.GetDecimal("quantidade");

            return item;
        }

        return null;
    }

    public async Task AtualizarQuantidade(Guid itemEstoqueId, decimal novaQuantidade, IDbTransaction transaction)
    {
        const string sql = @"
            UPDATE estoque_certo.item_estoque
            SET quantidade = @quantidade
            WHERE item_estoque_id = @id;
        ";

        await using var cmd = new NpgsqlCommand(sql, (NpgsqlConnection)transaction.Connection!, (NpgsqlTransaction)transaction);
        cmd.Parameters.Add("id", NpgsqlDbType.Uuid).Value = itemEstoqueId;
        cmd.Parameters.Add("quantidade", NpgsqlDbType.Numeric).Value = novaQuantidade;

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> TransferirEspaco(Guid itemEstoqueId, Guid novoEspacoId)
    {
        const string sql = @"
            UPDATE
                estoque_certo.item_estoque
            SET
                espaco_id = @novo_espaco_id
            WHERE
                item_estoque_id = @item_estoque_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("item_estoque_id", NpgsqlDbType.Uuid).Value = itemEstoqueId;
            cmd.Parameters.Add("novo_espaco_id", NpgsqlDbType.Uuid).Value = novoEspacoId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> TransferirEspaco(Guid itemEstoqueId, Guid novoEspacoId, IDbTransaction transaction)
    {
        const string sql = @"
            UPDATE
                estoque_certo.item_estoque
            SET
                espaco_id = @novo_espaco_id
            WHERE
                item_estoque_id = @item_estoque_id;
        ";

        await using var cmd = new NpgsqlCommand(sql, (NpgsqlConnection)transaction.Connection!, (NpgsqlTransaction)transaction);

        cmd.Parameters.Add("item_estoque_id", NpgsqlDbType.Uuid).Value = itemEstoqueId;
        cmd.Parameters.Add("novo_espaco_id", NpgsqlDbType.Uuid).Value = novoEspacoId;

        return await cmd.ExecuteNonQueryAsync();
    }
    public async Task<List<PizzaDashboardItem>> ObterPizzaDashboard(
    Guid unidadeOrganizacionalId,
    Guid? espacoId,
    int? tipoUnidadeMedida // ou TipoUnidadeMedida? se preferir enum
)
    {
        var itens = new List<PizzaDashboardItem>();

        // Sem espacoId -> agrupa por ESPAÇO (pizza por espaço)
        string sql = @"
        SELECT
            e.nome AS label,
            SUM(i.quantidade) AS value
        FROM estoque_certo.item_estoque i
        JOIN estoque_certo.espaco e ON e.espaco_id = i.espaco_id
        WHERE i.unidade_organizacional_id = @unidade_organizacional_id
    ";

        if (espacoId != null)
        {
            // Com espacoId -> agrupa por TIPO DE UNIDADE (pizza dentro do espaço)
            sql = @"
            SELECT
                i.tipo_unidade_medida::text AS label,
                SUM(i.quantidade) AS value
            FROM estoque_certo.item_estoque i
            WHERE i.unidade_organizacional_id = @unidade_organizacional_id
              AND i.espaco_id = @espaco_id
        ";
        }

        if (tipoUnidadeMedida != null)
        {
            sql += " AND i.tipo_unidade_medida = @tipo_unidade_medida";
        }


        if (espacoId == null)
        {
            sql += " GROUP BY e.nome ORDER BY e.nome;";
        }
        else
        {
            sql += " GROUP BY i.tipo_unidade_medida ORDER BY i.tipo_unidade_medida;";
        }

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid)
                .Value = unidadeOrganizacionalId;

            if (espacoId != null)
            {
                cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = espacoId.Value;
            }

            if (tipoUnidadeMedida != null)
            {
                cmd.Parameters.Add("tipo_unidade_medida", NpgsqlDbType.Integer).Value = tipoUnidadeMedida.Value;
            }

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                itens.Add(new PizzaDashboardItem
                {
                    Label = reader.GetString("label"),
                    Value = reader.GetDecimal("value")
                });
            }

            return itens;
        }
        catch
        {
            throw;
        }
    }
}
