using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class ClienteEnderecoRepository : BaseRepository, IClienteEnderecoRepository
{
    public ClienteEnderecoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(ClienteEndereco endereco)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.cliente_endereco
            (
                cliente_endereco_id,
                cliente_id,
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
                @cliente_endereco_id,
                @cliente_id,
                @logradouro,
                @numero,
                @complemento,
                @bairro,
                @cidade,
                @uf,
                @cep,
                @default
            )
            RETURNING cliente_endereco_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_endereco_id", NpgsqlDbType.Uuid).Value = endereco.ClienteEnderecoId;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = endereco.ClienteId;
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
        catch
        {
            throw;
        }
    }

    public async Task<List<ClienteEndereco>> Obter(Guid clienteId)
    {
        const string sql = @"
            SELECT
                cliente_endereco_id,
                cliente_id,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                cep,
                ""default""
            FROM
                pedido_certo_ai.cliente_endereco
            WHERE
                cliente_id = @cliente_id
            ORDER BY ""default"" DESC, logradouro;
        ";

        var enderecos = new List<ClienteEndereco>();

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                enderecos.Add(new ClienteEndereco
                {
                    ClienteEnderecoId = reader.GetGuid("cliente_endereco_id"),
                    ClienteId = reader.GetGuid("cliente_id"),
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
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(ClienteEndereco endereco)
    {
        const string sql = @"
            UPDATE pedido_certo_ai.cliente_endereco
            SET
                logradouro = @logradouro,
                numero = @numero,
                complemento = @complemento,
                bairro = @bairro,
                cidade = @cidade,
                uf = @uf,
                cep = @cep
            WHERE
                cliente_id = @cliente_id
                AND cliente_endereco_id = @cliente_endereco_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_endereco_id", NpgsqlDbType.Uuid).Value = endereco.ClienteEnderecoId;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = endereco.ClienteId;
            cmd.Parameters.Add("logradouro", NpgsqlDbType.Varchar).Value = endereco.Logradouro;
            cmd.Parameters.Add("numero", NpgsqlDbType.Varchar).Value = endereco.Numero;
            cmd.Parameters.Add("complemento", NpgsqlDbType.Varchar).Value = endereco.Complemento;
            cmd.Parameters.Add("bairro", NpgsqlDbType.Varchar).Value = endereco.Bairro;
            cmd.Parameters.Add("cidade", NpgsqlDbType.Varchar).Value = endereco.Cidade;
            cmd.Parameters.Add("uf", NpgsqlDbType.Varchar).Value = endereco.Uf;
            cmd.Parameters.Add("cep", NpgsqlDbType.Varchar).Value = endereco.Cep;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Excluir(Guid clienteId, Guid clienteEnderecoId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.cliente_endereco
            WHERE
                cliente_id = @cliente_id
                AND cliente_endereco_id = @cliente_endereco_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;
            cmd.Parameters.Add("cliente_endereco_id", NpgsqlDbType.Uuid).Value = clienteEnderecoId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> ExcluirPorCliente(Guid clienteId)
    {
        const string sql = @"
            DELETE FROM pedido_certo_ai.cliente_endereco
            WHERE cliente_id = @cliente_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> DefinirDefault(Guid clienteId, Guid clienteEnderecoId)
    {
        try
        {
            await EnsureOpenAsync();

            await using var transaction = await ((NpgsqlConnection)Connection).BeginTransactionAsync();

            const string limparSql = @"
                UPDATE pedido_certo_ai.cliente_endereco
                SET ""default"" = FALSE
                WHERE cliente_id = @cliente_id;
            ";

            await using (var limparCmd = new NpgsqlCommand(limparSql, (NpgsqlConnection)Connection, transaction))
            {
                limparCmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;
                await limparCmd.ExecuteNonQueryAsync();
            }

            const string definirSql = @"
                UPDATE pedido_certo_ai.cliente_endereco
                SET ""default"" = TRUE
                WHERE
                    cliente_id = @cliente_id
                    AND cliente_endereco_id = @cliente_endereco_id;
            ";

            int affected;

            await using (var definirCmd = new NpgsqlCommand(definirSql, (NpgsqlConnection)Connection, transaction))
            {
                definirCmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId;
                definirCmd.Parameters.Add("cliente_endereco_id", NpgsqlDbType.Uuid).Value = clienteEnderecoId;
                affected = await definirCmd.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            return affected;
        }
        catch
        {
            throw;
        }
    }
}
