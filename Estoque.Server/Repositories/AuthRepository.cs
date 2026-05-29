using Estoque.Server.Models;
using Estoque.Server.Utils;
using Npgsql;
using System.Data;

namespace Estoque.Server.Repositories;

public class AuthRepository : BaseRepository
{
    public AuthRepository(IDbConnection connection) : base(connection) { }

    public async Task<Usuario?> ObterUsername(string username, Guid unidadeOrganizacionalId)
    {
        const string sql = @"
            SELECT 
                usuario_id,
                username,
                senha,
                nome,
                perfil,
                unidade_organizacional_id,
                valido
            FROM estoque_certo.usuario
            WHERE username = @username
              AND unidade_organizacional_id = @unidade_organizacional_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("username", NpgsqlTypes.NpgsqlDbType.Varchar).Value = username;
            cmd.Parameters.Add("unidade_organizacional_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = unidadeOrganizacionalId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var usuario = new Usuario();

                usuario.UsuarioId = reader.GetGuid("usuario_id");
                usuario.Username = reader.GetString("username");
                usuario.Senha = reader.GetString("senha");
                usuario.Nome = reader.GetString("nome");
                usuario.Perfil = (PerfilUsuario)reader.GetInt32("perfil");
                usuario.UnidadeOrganizacionalId = reader.GetGuidNullable("unidade_organizacional_id");
                usuario.Valido = reader.GetBoolean("valido");

                return usuario;
            }

            return null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<CodigoAcesso?> ObterCodigoPorSms(string codigoSms)
    {
        const string sql = @"
            SELECT 
                usuario_id,
                codigo,
                data_solicitacao,
                data_validacao,
                utilizado,
                codigo_reset_id,
                data_reset_id,
                reset_efetuado
            FROM 
                estoque_certo.codigo_acesso
            WHERE 
                codigo = @codigo
            ORDER BY 
                data_solicitacao DESC
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("codigo", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoSms;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var codigoAcesso = new CodigoAcesso();

                codigoAcesso.UsuarioId = reader.GetGuid("usuario_id");
                codigoAcesso.Codigo = reader.GetString("codigo");
                codigoAcesso.DataSolicitacao = reader.GetDateTime("data_solicitacao");
                codigoAcesso.DataValidacao = reader.GetDateTimeNullable("data_validacao");
                codigoAcesso.Utilizado = reader.GetBoolean("utilizado");
                codigoAcesso.CodigoResetId = reader.GetStringNullable("codigo_reset_id");
                codigoAcesso.DataResetId = reader.GetDateTimeNullable("data_reset_id");
                codigoAcesso.ResetEfetuado = reader.GetBoolean("reset_efetuado");

                return codigoAcesso;
            }

            return null;
        }
        catch
        {
            throw;
        }
    }

    public async Task AtualizarCodigoValidado(Guid usuarioId, string codigoSms, string codigoResetId)
    {
        const string sql = @"
            UPDATE 
                estoque_certo.codigo_acesso 
            SET 
                utilizado = true, 
                data_validacao = @data_validacao,
                codigo_reset_id = @codigo_reset_id,
                data_reset_id = @data_reset_id

            WHERE 
                usuario_id = @usuario_id 
                AND codigo = @codigo;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            var agora = DateTimeHelper.SaoPaulo();

            cmd.Parameters.Add("data_validacao", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = agora;
            cmd.Parameters.Add("codigo_reset_id", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoResetId;
            cmd.Parameters.Add("data_reset_id", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = agora;
            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("codigo", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoSms;

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> BuscarUltimoCodigo(Guid usuarioId, DateTime dataSolicitacao)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1 
                FROM estoque_certo.codigo_acesso 
                WHERE usuario_id = @usuario_id 
                  AND data_solicitacao > @data_solicitacao
            );
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("data_solicitacao", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = dataSolicitacao;

            return (bool)(await cmd.ExecuteScalarAsync())!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<CodigoAcesso?> ObterCodigoPorId(string codigoResetId)
    {
        const string sql = @"
            SELECT 
                usuario_id,
                codigo,
                data_solicitacao,
                data_validacao,
                utilizado,
                codigo_reset_id,
                data_reset_id,
                reset_efetuado
            FROM 
                estoque_certo.codigo_acesso
            WHERE 
                codigo_reset_id = @codigo_reset_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("codigo_reset_id", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoResetId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var codigoAcesso = new CodigoAcesso();

                codigoAcesso.UsuarioId = reader.GetGuid("usuario_id");
                codigoAcesso.Codigo = reader.GetString("codigo");
                codigoAcesso.DataSolicitacao = reader.GetDateTime("data_solicitacao");
                codigoAcesso.DataValidacao = reader.GetDateTimeNullable("data_validacao");
                codigoAcesso.Utilizado = reader.GetBoolean("utilizado");
                codigoAcesso.CodigoResetId = reader.GetStringNullable("codigo_reset_id");
                codigoAcesso.DataResetId = reader.GetDateTimeNullable("data_reset_id");
                codigoAcesso.ResetEfetuado = reader.GetBoolean("reset_efetuado");

                return codigoAcesso;
            }
            return null;
        }
        catch
        {
            throw;
        }
    }

    public async Task InserirCodigoAcesso(Guid usuarioId, string codigo)
    {
        const string sql = @"
            INSERT INTO estoque_certo.codigo_acesso 
            (
                usuario_id,
                codigo,
                data_solicitacao,
                utilizado
            ) 
            VALUES 
            (
                @usuario_id,
                @codigo,
                @data_solicitacao,
                false
            );
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            var agora = DateTimeHelper.SaoPaulo();

            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("codigo", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigo;
            cmd.Parameters.Add("data_solicitacao", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = agora;

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> RedefinirSenha(Guid usuarioId, string novaSenha)
    {
        const string sql = "UPDATE estoque_certo.usuario SET senha = @senha WHERE usuario_id = @usuario_id";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("senha", NpgsqlTypes.NpgsqlDbType.Varchar).Value = novaSenha;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task MarcarResetEfetuado(string codigoResetId)
    {
        const string sql = @"
            UPDATE
                estoque_certo.codigo_acesso 
            SET 
                reset_efetuado = true 
            WHERE 
                codigo_reset_id = @codigo_reset_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("codigo_reset_id", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoResetId;

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }
}