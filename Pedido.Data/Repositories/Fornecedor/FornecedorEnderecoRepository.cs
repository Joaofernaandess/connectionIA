using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class FornecedorEnderecoRepository : BaseRepository, IFornecedorEnderecoRepository
{
    public FornecedorEnderecoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(FornecedorEndereco endereco)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.fornecedor_endereco
            (
                fornecedor_endereco_id,
                fornecedor_id,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                cep,
                ""default""
            )
            VALUES
            (
                @fornecedor_endereco_id,
                @fornecedor_id,
                @logradouro,
                @numero,
                @complemento,
                @bairro,
                @cidade,
                @uf,
                @cep,
                @default
            )
            RETURNING fornecedor_endereco_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_endereco_id", NpgsqlDbType.Uuid).Value = endereco.FornecedorEnderecoId;
        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = endereco.FornecedorId;
        cmd.Parameters.Add("logradouro", NpgsqlDbType.Varchar).Value = endereco.Logradouro;
        cmd.Parameters.Add("numero", NpgsqlDbType.Varchar).Value = endereco.Numero;
        cmd.Parameters.Add("complemento", NpgsqlDbType.Varchar).Value = endereco.Complemento;
        cmd.Parameters.Add("bairro", NpgsqlDbType.Varchar).Value = endereco.Bairro;
        cmd.Parameters.Add("cidade", NpgsqlDbType.Varchar).Value = endereco.Cidade;
        cmd.Parameters.Add("uf", NpgsqlDbType.Varchar).Value = endereco.Uf;
        cmd.Parameters.Add("cep", NpgsqlDbType.Varchar).Value = endereco.Cep;
        cmd.Parameters.Add("default", NpgsqlDbType.Boolean).Value = endereco.Default;

        var result = await cmd.ExecuteScalarAsync();

        return (Guid)result!;
    }

    public async Task<List<FornecedorEndereco>> Obter(Guid fornecedorId)
    {
        const string sql = @"
            SELECT
                fornecedor_endereco_id,
                fornecedor_id,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                cep,
                ""default""
            FROM
                pedido_certo_ai.fornecedor_endereco
            WHERE
                fornecedor_id = @fornecedor_id
            ORDER BY ""default"" DESC, logradouro;
        ";

        var enderecos = new List<FornecedorEndereco>();

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;

        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            enderecos.Add(new FornecedorEndereco
            {
                FornecedorEnderecoId = reader.GetGuid("fornecedor_endereco_id"),
                FornecedorId = reader.GetGuid("fornecedor_id"),
                Logradouro = reader.GetString("logradouro"),
                Numero = reader.GetString("numero"),
                Complemento = reader.GetStringNullable("complemento") ?? string.Empty,
                Bairro = reader.GetString("bairro"),
                Cidade = reader.GetString("cidade"),
                Uf = reader.GetString("uf"),
                Cep = reader.GetString("cep"),
                Default = reader.GetBoolean("default")
            });
        }

        return enderecos;
    }

    public async Task<int> Atualizar(FornecedorEndereco endereco)
    {
        const string sql = @"
            UPDATE pedido_certo_ai.fornecedor_endereco
            SET
                logradouro = @logradouro,
                numero = @numero,
                complemento = @complemento,
                bairro = @bairro,
                cidade = @cidade,
                uf = @uf,
                cep = @cep
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_endereco_id = @fornecedor_endereco_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_endereco_id", NpgsqlDbType.Uuid).Value = endereco.FornecedorEnderecoId;
        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = endereco.FornecedorId;
        cmd.Parameters.Add("logradouro", NpgsqlDbType.Varchar).Value = endereco.Logradouro;
        cmd.Parameters.Add("numero", NpgsqlDbType.Varchar).Value = endereco.Numero;
        cmd.Parameters.Add("complemento", NpgsqlDbType.Varchar).Value = endereco.Complemento;
        cmd.Parameters.Add("bairro", NpgsqlDbType.Varchar).Value = endereco.Bairro;
        cmd.Parameters.Add("cidade", NpgsqlDbType.Varchar).Value = endereco.Cidade;
        cmd.Parameters.Add("uf", NpgsqlDbType.Varchar).Value = endereco.Uf;
        cmd.Parameters.Add("cep", NpgsqlDbType.Varchar).Value = endereco.Cep;

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> Excluir(Guid fornecedorId, Guid fornecedorEnderecoId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.fornecedor_endereco
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_endereco_id = @fornecedor_endereco_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;
        cmd.Parameters.Add("fornecedor_endereco_id", NpgsqlDbType.Uuid).Value = fornecedorEnderecoId;

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> ExcluirPorFornecedor(Guid fornecedorId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.fornecedor_endereco
            WHERE fornecedor_id = @fornecedor_id;
        ";

        await EnsureOpenAsync();
        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> DefinirDefault(Guid fornecedorId, Guid fornecedorEnderecoId)
    {
        await EnsureOpenAsync();
        await using var transaction = await ((NpgsqlConnection)Connection).BeginTransactionAsync();

        const string limparSql = @"
            UPDATE pedido_certo_ai.fornecedor_endereco
            SET ""default"" = FALSE
            WHERE fornecedor_id = @fornecedor_id;
        ";

        await using (var limparCmd = new NpgsqlCommand(limparSql, (NpgsqlConnection)Connection, transaction))
        {
            limparCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;
            await limparCmd.ExecuteNonQueryAsync();
        }

        const string definirSql = @"
            UPDATE pedido_certo_ai.fornecedor_endereco
            SET ""default"" = TRUE
            WHERE
                fornecedor_id = @fornecedor_id
                AND fornecedor_endereco_id = @fornecedor_endereco_id;
        ";

        int affected;

        await using (var definirCmd = new NpgsqlCommand(definirSql, (NpgsqlConnection)Connection, transaction))
        {
            definirCmd.Parameters.Add("fornecedor_id", NpgsqlDbType.Uuid).Value = fornecedorId;
            definirCmd.Parameters.Add("fornecedor_endereco_id", NpgsqlDbType.Uuid).Value = fornecedorEnderecoId;
            affected = await definirCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();

        return affected;
    }
}
