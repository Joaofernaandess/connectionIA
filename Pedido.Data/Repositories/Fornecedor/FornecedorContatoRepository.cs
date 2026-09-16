using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class FornecedorContatoRepository : BaseRepository, IFornecedorContatoRepository
{
    public FornecedorContatoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(FornecedorContato contato)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.fornecedor_contato
            (
                fornecedor_contato_id,
                fornecedor_id,
                tipo_contato,
                valor,
                ""default""
            )
            VALUES
            (
                @fornecedor_contato_id,
                @fornecedor_id,
                @tipo_contato,
                @valor,
                @default
            )
            RETURNING fornecedor_contato_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = contato.FornecedorContatoId;
        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = contato.FornecedorId;
        cmd.Parameters.Add("tipo_contato", NpgsqlDbType.Integer).Value = (int)contato.TipoContato;
        cmd.Parameters.Add("valor", NpgsqlDbType.Varchar).Value = contato.Valor;
        cmd.Parameters.Add("default", NpgsqlDbType.Boolean).Value = contato.Default;

        var result = await cmd.ExecuteScalarAsync();

        return (Guid)result!;
    }

    public async Task<List<FornecedorContato>> Obter(Guid fornecedorId)
    {
        const string sql = @"
            SELECT
                fornecedor_contato_id,
                fornecedor_id,
                tipo_contato,
                valor,
                ""default""
            FROM
                pedido_certo_ai.fornecedor_contato
            WHERE
                fornecedor_id = @fornecedor_id
            ORDER BY ""default"" DESC, tipo_contato, valor;
        ";

        var contatos = new List<FornecedorContato>();

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;

        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            contatos.Add(new FornecedorContato
            {
                FornecedorContatoId = reader.GetGuid("fornecedor_contato_id"),
                FornecedorId = reader.GetGuid("fornecedor_id"),
                TipoContato = (TipoContato)reader.GetInt32("tipo_contato"),
                Valor = reader.GetString("valor"),
                Default = reader.GetBoolean("default")
            });
        }

        return contatos;
    }

    public async Task<int> Atualizar(FornecedorContato contato)
    {
        const string atualizarSql = @"
            UPDATE pedido_certo_ai.fornecedor_contato
            SET
                tipo_contato = @tipo_contato,
                valor = @valor
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_contato_id = @fornecedor_contato_id;
        ";

        await EnsureOpenAsync();
        await using var transaction = await ((NpgsqlConnection)Connection).BeginTransactionAsync();

        const string obterDefaultSql = @"
            SELECT ""default""
            FROM pedido_certo_ai.fornecedor_contato
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_contato_id = @fornecedor_contato_id;
        ";

        var contatoDefault = false;

        await using (var obterDefaultCmd = new NpgsqlCommand(obterDefaultSql, (NpgsqlConnection)Connection, transaction))
        {
            obterDefaultCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = contato.FornecedorId;
            obterDefaultCmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = contato.FornecedorContatoId;

            var result = await obterDefaultCmd.ExecuteScalarAsync();
            contatoDefault = result is bool valorDefault && valorDefault;
        }

        if (contatoDefault)
        {
            const string limparMesmoTipoSql = @"
                UPDATE pedido_certo_ai.fornecedor_contato
                SET ""default"" = FALSE
                WHERE
                    fornecedor_id = @fornecedor_id
                    AND fornecedor_contato_id <> @fornecedor_contato_id
                    AND tipo_contato = @tipo_contato;
            ";

            await using var limparMesmoTipoCmd = new NpgsqlCommand(limparMesmoTipoSql, (NpgsqlConnection)Connection, transaction);

            limparMesmoTipoCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = contato.FornecedorId;
            limparMesmoTipoCmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = contato.FornecedorContatoId;
            limparMesmoTipoCmd.Parameters.Add("tipo_contato", NpgsqlDbType.Integer).Value = (int)contato.TipoContato;

            await limparMesmoTipoCmd.ExecuteNonQueryAsync();
        }

        int affected;

        await using (var atualizarCmd = new NpgsqlCommand(atualizarSql, (NpgsqlConnection)Connection, transaction))
        {
            atualizarCmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = contato.FornecedorContatoId;
            atualizarCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = contato.FornecedorId;
            atualizarCmd.Parameters.Add("tipo_contato", NpgsqlDbType.Integer).Value = (int)contato.TipoContato;
            atualizarCmd.Parameters.Add("valor", NpgsqlDbType.Varchar).Value = contato.Valor;

            affected = await atualizarCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();

        return affected;
    }

    public async Task<int> Excluir(Guid fornecedorId, Guid fornecedorContatoId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.fornecedor_contato
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_contato_id = @fornecedor_contato_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;
        cmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = fornecedorContatoId;

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> ExcluirPorFornecedor(Guid fornecedorId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.fornecedor_contato
            WHERE fornecedor_id = @fornecedor_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> DefinirDefault(Guid fornecedorId, Guid fornecedorContatoId)
    {
        await EnsureOpenAsync();
        await using var transaction = await ((NpgsqlConnection)Connection).BeginTransactionAsync();

        const string limparSql = @"
            UPDATE pedido_certo_ai.fornecedor_contato
            SET ""default"" = FALSE
            WHERE
                fornecedor_id = @fornecedor_id
                AND tipo_contato = (
                    SELECT tipo_contato
                    FROM pedido_certo_ai.fornecedor_contato
                    WHERE
                        fornecedor_id = @fornecedor_id
                        AND fornecedor_contato_id = @fornecedor_contato_id
                );
        ";

        await using (var limparCmd = new NpgsqlCommand(limparSql, (NpgsqlConnection)Connection, transaction))
        {
            limparCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;
            limparCmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = fornecedorContatoId;
            await limparCmd.ExecuteNonQueryAsync();
        }

        const string definirSql = @"
            UPDATE pedido_certo_ai.fornecedor_contato
            SET ""default"" = TRUE
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_contato_id = @fornecedor_contato_id;
        ";

        int affected;

        await using (var definirCmd = new NpgsqlCommand(definirSql, (NpgsqlConnection)Connection, transaction))
        {
            definirCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;
            definirCmd.Parameters.Add("fornecedor_contato_id", NpgsqlDbType.Uuid).Value = fornecedorContatoId;
            affected = await definirCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();

        return affected;
    }
}
