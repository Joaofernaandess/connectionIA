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
                cadastro_completo,
                jornada_usuario
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
                usuario.CadastroCompleto = reader.GetBoolean("cadastro_completo");
                usuario.JornadaUsuario = (JornadaUsuario)reader.GetInt32("jornada_usuario");

                return usuario;
            }

            return null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Usuario?> ObterUsuario(Guid usuarioId)
    {
        const string sql = @"
            SELECT 
                usuario_id,
                username,
                senha,
                nome,
                perfil,
                unidade_organizacional_id,
                cadastro_completo,
                jornada_usuario
            FROM estoque_certo.usuario
            WHERE usuario_id = @usuario_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return new Usuario
            {
                UsuarioId = reader.GetGuid("usuario_id"),
                Username = reader.GetString("username"),
                Senha = reader.GetString("senha"),
                Nome = reader.GetString("nome"),
                Perfil = (PerfilUsuario)reader.GetInt32("perfil"),
                UnidadeOrganizacionalId = reader.GetGuidNullable("unidade_organizacional_id"),
                CadastroCompleto = reader.GetBoolean("cadastro_completo"),
                JornadaUsuario = (JornadaUsuario)reader.GetInt32("jornada_usuario")
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<CodigoAcesso?> ObterCodigoPorSms(string codigoSms, Guid? usuarioId = null)
    {
        var sql = @"
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
        ";

        if (usuarioId.HasValue)
            sql += " AND usuario_id = @usuario_id";

        sql += @"
            ORDER BY 
                data_solicitacao DESC
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("codigo", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoSms;
            if (usuarioId.HasValue)
                cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId.Value;

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

    public async Task AtualizarCodigoCadastroValidado(Guid usuarioId, string codigoSms)
    {
        const string sql = @"
            UPDATE 
                estoque_certo.codigo_acesso 
            SET 
                utilizado = true, 
                data_validacao = @data_validacao
            WHERE 
                usuario_id = @usuario_id 
                AND codigo = @codigo;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("data_validacao", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = DateTimeHelper.SaoPaulo();
            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("codigo", NpgsqlTypes.NpgsqlDbType.Varchar).Value = codigoSms;

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> AtualizarJornadaUsuario(Guid usuarioId, JornadaUsuario jornadaUsuario)
    {
        const string sql = @"
            UPDATE estoque_certo.usuario
            SET jornada_usuario = @jornada_usuario
            WHERE usuario_id = @usuario_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("jornada_usuario", NpgsqlTypes.NpgsqlDbType.Integer).Value = (int)jornadaUsuario;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> BuscarUltimoCodigo(Guid usuarioId, DateTime dataSolicitacao, int? minutosCooldown = null, int quantidadeMinima = 1)
    {
        const string sql = @"
            SELECT COUNT(1) >= @quantidade_minima
            FROM (
                SELECT 1 
                FROM estoque_certo.codigo_acesso 
                WHERE usuario_id = @usuario_id 
                  AND data_solicitacao > @data_solicitacao
                  AND (@minutos_cooldown IS NULL OR data_solicitacao > @agora - (@minutos_cooldown * INTERVAL '1 minute'))
                LIMIT @quantidade_minima
            ) codigos;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlTypes.NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("data_solicitacao", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = dataSolicitacao;
            cmd.Parameters.Add("agora", NpgsqlTypes.NpgsqlDbType.Timestamp).Value = DateTimeHelper.SaoPaulo();
            cmd.Parameters.Add("minutos_cooldown", NpgsqlTypes.NpgsqlDbType.Integer).Value = minutosCooldown.HasValue ? minutosCooldown.Value : DBNull.Value;
            cmd.Parameters.Add("quantidade_minima", NpgsqlTypes.NpgsqlDbType.Integer).Value = quantidadeMinima;

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