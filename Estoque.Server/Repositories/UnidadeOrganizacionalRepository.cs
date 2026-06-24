using Estoque.Server.Models;
using Npgsql;
using NpgsqlTypes;
using System.Data;

namespace Estoque.Server.Repositories;

public class UnidadeOrganizacionalRepository : BaseRepository
{
    public UnidadeOrganizacionalRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(UnidadeOrganizacional unidadeOrganizacional)
    {
        const string sql = @"
            INSERT INTO estoque_certo.unidade_organizacional
            (
                matriz_id,
                cnpj,
                razao_social,
                nome_fantasia,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                pais,
                email,
                telefone
            )
            VALUES
            (
                @matriz_id,
                @cnpj,
                @razao_social,
                @nome_fantasia,
                @cep,
                @endereco,
                @numero,
                @complemento,
                @bairro,
                @cidade,
                @uf,
                @pais,
                @email,
                @telefone
            )
            RETURNING unidade_organizacional_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("matriz_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacional.MatrizId.ToDbValue();
            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Cnpj;
            cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.RazaoSocial;
            cmd.Parameters.Add("nome_fantasia", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.NomeFantasia.ToDbValue();
            cmd.Parameters.Add("cep", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Cep.ToDbValue();
            cmd.Parameters.Add("endereco", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Endereco.ToDbValue();
            cmd.Parameters.Add("numero", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Numero.ToDbValue();
            cmd.Parameters.Add("complemento", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Complemento.ToDbValue();
            cmd.Parameters.Add("bairro", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Bairro.ToDbValue();
            cmd.Parameters.Add("cidade", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Cidade.ToDbValue();
            cmd.Parameters.Add("uf", NpgsqlDbType.Char).Value = unidadeOrganizacional.Uf.ToDbValue();
            cmd.Parameters.Add("pais", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Pais.ToDbValue();
            cmd.Parameters.Add("email", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Email.ToDbValue();
            cmd.Parameters.Add("telefone", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Telefone.ToDbValue();

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            throw;
        }
    }

    public async Task<int> Atualizar(UnidadeOrganizacional unidadeOrganizacional, Guid unidadeOrganizacionalId)
    {
        const string sql = @"
            UPDATE
                estoque_certo.unidade_organizacional
            SET
                matriz_id = @matriz_id,
                cnpj = @cnpj,
                razao_social = @razao_social,
                nome_fantasia = @nome_fantasia,
                cep = @cep,
                endereco = @endereco,
                numero = @numero,
                complemento = @complemento,
                bairro = @bairro,
                cidade = @cidade,
                uf = @uf,
                pais = @pais,
                email = @email,
                telefone = @telefone
            WHERE
                unidade_organizacional_id = @unidade_organizacional_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId;

            cmd.Parameters.Add("matriz_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacional.MatrizId.ToDbValue();
            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Cnpj;
            cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.RazaoSocial;
            cmd.Parameters.Add("nome_fantasia", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.NomeFantasia.ToDbValue();
            cmd.Parameters.Add("cep", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Cep.ToDbValue();
            cmd.Parameters.Add("endereco", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Endereco.ToDbValue();
            cmd.Parameters.Add("numero", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Numero.ToDbValue();
            cmd.Parameters.Add("complemento", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Complemento.ToDbValue();
            cmd.Parameters.Add("bairro", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Bairro.ToDbValue();
            cmd.Parameters.Add("cidade", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Cidade.ToDbValue();
            cmd.Parameters.Add("uf", NpgsqlDbType.Char).Value = unidadeOrganizacional.Uf.ToDbValue();
            cmd.Parameters.Add("pais", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Pais.ToDbValue();
            cmd.Parameters.Add("email", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Email.ToDbValue();
            cmd.Parameters.Add("telefone", NpgsqlDbType.Varchar).Value = unidadeOrganizacional.Telefone.ToDbValue();

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<UnidadeOrganizacionalGetResponse>> Obter(int skip, int top, string? razaoSocial, string? cnpj)
    {
        var unidadesOrganizacionaisGetResponse = new List<UnidadeOrganizacionalGetResponse>();

        string sql = @"
            SELECT
                unidade_organizacional_id,
                matriz_id,
                cnpj,
                razao_social,
                nome_fantasia,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                pais,
                email,
                telefone
            FROM
                estoque_certo.unidade_organizacional
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(razaoSocial)) sql += " AND razao_social ILIKE @razao_social ";

        if (!string.IsNullOrWhiteSpace(cnpj)) sql += " AND cnpj ILIKE @cnpj ";

        sql += " ORDER BY razao_social LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("razao_social", NpgsqlDbType.Varchar).Value = $"%{razaoSocial?.Trim()}%";
            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = $"%{cnpj?.Trim()}%";
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = top;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = skip;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var unidadeOrganizacionalGetResponse = new UnidadeOrganizacionalGetResponse();

                unidadeOrganizacionalGetResponse.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
                unidadeOrganizacionalGetResponse.MatrizId = reader.GetGuidNullable("matriz_id");
                unidadeOrganizacionalGetResponse.Cnpj = reader.GetString("cnpj");
                unidadeOrganizacionalGetResponse.RazaoSocial = reader.GetString("razao_social");
                unidadeOrganizacionalGetResponse.NomeFantasia = reader.GetStringNullable("nome_fantasia");
                unidadeOrganizacionalGetResponse.Cep = reader.GetStringNullable("cep");
                unidadeOrganizacionalGetResponse.Endereco = reader.GetStringNullable("endereco");
                unidadeOrganizacionalGetResponse.Numero = reader.GetStringNullable("numero");
                unidadeOrganizacionalGetResponse.Complemento = reader.GetStringNullable("complemento");
                unidadeOrganizacionalGetResponse.Bairro = reader.GetStringNullable("bairro");
                unidadeOrganizacionalGetResponse.Cidade = reader.GetStringNullable("cidade");
                unidadeOrganizacionalGetResponse.Uf = reader.GetStringNullable("uf");
                unidadeOrganizacionalGetResponse.Pais = reader.GetStringNullable("pais");
                unidadeOrganizacionalGetResponse.Email = reader.GetStringNullable("email");
                unidadeOrganizacionalGetResponse.Telefone = reader.GetStringNullable("telefone");

                unidadesOrganizacionaisGetResponse.Add(unidadeOrganizacionalGetResponse);
            }

            return unidadesOrganizacionaisGetResponse;
        }
        catch
        {
            throw;
        }
    }

    public async Task<UnidadeOrganizacionalGetResponse?> Obter(Guid unidadeOrganizacionalId)
    {
        const string sql = @"
            SELECT
                unidade_organizacional_id,
                matriz_id,
                cnpj,
                razao_social,
                nome_fantasia,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                pais,
                email,
                telefone
            FROM
                estoque_certo.unidade_organizacional
            WHERE
                unidade_organizacional_id = @unidade_organizacional_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            var unidadeOrganizacionalGetResponse = new UnidadeOrganizacionalGetResponse();

            unidadeOrganizacionalGetResponse.UnidadeOrganizacionalId = reader.GetGuid("unidade_organizacional_id");
            unidadeOrganizacionalGetResponse.MatrizId = reader.GetGuidNullable("matriz_id");
            unidadeOrganizacionalGetResponse.Cnpj = reader.GetString("cnpj");
            unidadeOrganizacionalGetResponse.RazaoSocial = reader.GetString("razao_social");
            unidadeOrganizacionalGetResponse.NomeFantasia = reader.GetStringNullable("nome_fantasia");
            unidadeOrganizacionalGetResponse.Cep = reader.GetStringNullable("cep");
            unidadeOrganizacionalGetResponse.Endereco = reader.GetStringNullable("endereco");
            unidadeOrganizacionalGetResponse.Numero = reader.GetStringNullable("numero");
            unidadeOrganizacionalGetResponse.Complemento = reader.GetStringNullable("complemento");
            unidadeOrganizacionalGetResponse.Bairro = reader.GetStringNullable("bairro");
            unidadeOrganizacionalGetResponse.Cidade = reader.GetStringNullable("cidade");
            unidadeOrganizacionalGetResponse.Uf = reader.GetStringNullable("uf");
            unidadeOrganizacionalGetResponse.Pais = reader.GetStringNullable("pais");
            unidadeOrganizacionalGetResponse.Email = reader.GetStringNullable("email");
            unidadeOrganizacionalGetResponse.Telefone = reader.GetStringNullable("telefone");

            return unidadeOrganizacionalGetResponse;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Excluir(Guid unidadeOrganizacionalId)
    {
        const string sql = "DELETE FROM estoque_certo.unidade_organizacional WHERE unidade_organizacional_id = @unidade_organizacional_id";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> ValidarDuplicidade(string cnpj, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                estoque_certo.unidade_organizacional
            WHERE
                cnpj = @cnpj
            AND
                unidade_organizacional_id <> @unidade_organizacional_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("cnpj", NpgsqlDbType.Varchar).Value = cnpj;
            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlDbType.Uuid).Value = ignoreId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }
}