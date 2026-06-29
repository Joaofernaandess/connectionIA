using Estoque.Server.Models;
using Npgsql;
using NpgsqlTypes;
using System.Data;

namespace Estoque.Server.Repositories;

public class EspacoRepository : BaseRepository
{
    public EspacoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Espaco espaco)
    {
        const string sql = @"
            INSERT INTO estoque_certo.espaco
            (
                unidade_organizacional_id,
                nome,
                descricao
            )
            VALUES
            (
                @unidade_organizacional_id,
                @nome,
                @descricao
            )
            RETURNING espaco_id;
        ";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = espaco.UnidadeOrganizacionalId;
        cmd.Parameters.Add("nome", NpgsqlDbType.Varchar).Value = espaco.Nome;
        cmd.Parameters.Add("descricao", NpgsqlDbType.Varchar).Value = espaco.Descricao.ToDbValue();

        var result = await cmd.ExecuteScalarAsync();

        return (Guid)result!;
    }

    public async Task<int> Atualizar(Espaco espaco, Guid espacoId)
    {
        const string sql = @"
            UPDATE
                estoque_certo.espaco
            SET
                nome = @nome,
                descricao = @descricao
            WHERE
                espaco_id = @espaco_id;
        ";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = espacoId;

        cmd.Parameters.Add("nome", NpgsqlDbType.Varchar).Value = espaco.Nome;
        cmd.Parameters.Add("descricao", NpgsqlDbType.Varchar).Value = espaco.Descricao.ToDbValue();

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<EspacoGetResponse>> Obter(int skip, int top, string? nome, Guid? unidadeOrganizacionalId)
    {
        var espacosGetResponse = new List<EspacoGetResponse>();

        string sql = @"
            SELECT
                espaco_id,
                unidade_organizacional_id,
                nome,
                descricao
            FROM
                estoque_certo.espaco
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(nome)) sql += " AND nome ILIKE @nome ";

        if (unidadeOrganizacionalId != null) sql += " AND unidade_organizacional_id = @unidade_organizacional_id ";

        sql += " ORDER BY nome LIMIT @top OFFSET @skip";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("nome", NpgsqlDbType.Varchar).Value = $"%{nome?.Trim()}%";
        cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId.ToDbValue();
        cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = top;
        cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = skip;

        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var espacoGetResponse = new EspacoGetResponse();

            espacoGetResponse.EspacoId = reader.GetGuid("espaco_id");
            espacoGetResponse.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
            espacoGetResponse.Nome = reader.GetString("nome");
            espacoGetResponse.Descricao = reader.GetStringNullable("descricao");

            espacosGetResponse.Add(espacoGetResponse);
        }

        return espacosGetResponse;
    }

    public async Task<EspacoGetResponse?> Obter(Guid espacoId)
    {
        const string sql = @"
            SELECT
                espaco_id,
                unidade_organizacional_id,
                nome,
                descricao
            FROM
                estoque_certo.espaco
            WHERE
                espaco_id = @espaco_id
            LIMIT 1;
        ";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = espacoId;

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync()) return null;

        var espacoGetResponse = new EspacoGetResponse();

        espacoGetResponse.EspacoId = reader.GetGuid("espaco_id");
        espacoGetResponse.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
        espacoGetResponse.Nome = reader.GetString("nome");
        espacoGetResponse.Descricao = reader.GetStringNullable("descricao");

        return espacoGetResponse;
    }

    public async Task<int> Excluir(Guid espacoId)
    {
        const string sql = "DELETE FROM estoque_certo.espaco WHERE espaco_id = @espaco_id";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = espacoId;

        return await cmd.ExecuteNonQueryAsync();
    }

    public async Task<bool> ValidarDuplicidade(string nome, Guid unidadeOrganizacionalId, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                estoque_certo.espaco
            WHERE
                LOWER(BTRIM(nome)) = LOWER(BTRIM(@nome))
            AND
                unidade_organizacional_id = @unidade_organizacional_id
            AND
                espaco_id <> @espaco_id
            LIMIT 1;
        ";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("nome", NpgsqlDbType.Varchar).Value = nome;
        cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId;
        cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = ignoreId;

        var result = await cmd.ExecuteScalarAsync();

        return result != null;
    }

    public async Task<bool> PossuiItensVinculados(Guid espacoId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                estoque_certo.item_estoque
            WHERE
                espaco_id = @espaco_id
            LIMIT 1;
        ";

        await EnsureOpenAsync();

        await using var cmd = new NpgsqlCommand(sql, Connection);

        cmd.Parameters.Add("espaco_id", NpgsqlDbType.Uuid).Value = espacoId;

        var result = await cmd.ExecuteScalarAsync();

        return result != null;
    }
}