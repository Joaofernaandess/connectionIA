using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class UsuarioRepository : BaseRepository, IUsuarioRepository
{
    public UsuarioRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Usuario usuario)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.usuario
            (
                username,
                senha,
                nome,
                perfil,
                cadastro_completo,
                jornada_usuario
            )
            VALUES
            (
                @username,
                @senha,
                @nome,
                @perfil,
                @cadastro_completo,
                @jornada_usuario
            )
            RETURNING usuario_id;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("username", NpgsqlDbType.Varchar).Value = usuario.Username;
            cmd.Parameters.Add("senha", NpgsqlDbType.Varchar).Value = usuario.Senha;
            cmd.Parameters.Add("nome", NpgsqlDbType.Varchar).Value = usuario.Nome;
            cmd.Parameters.Add("perfil", NpgsqlDbType.Integer).Value = (int)usuario.Perfil;
            cmd.Parameters.Add("cadastro_completo", NpgsqlDbType.Boolean).Value = usuario.CadastroCompleto;
            cmd.Parameters.Add("jornada_usuario", NpgsqlDbType.Integer).Value = (int)usuario.JornadaUsuario;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(UsuarioPutRequest usuario, Guid usuarioId)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.usuario
            SET
                nome = @nome
            WHERE
                usuario_id = @usuario_id
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("nome", NpgsqlDbType.Varchar).Value = usuario.Nome;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<Usuario?> Obter(Guid usuarioId)
    {
        const string sql = @"
            SELECT
                usuario_id,
                username,
                senha,
                nome,
                perfil,
                cadastro_completo,
                jornada_usuario
            FROM
                pedido_certo_ai.usuario
            WHERE
                usuario_id = @usuario_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlDbType.Uuid).Value = usuarioId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            var usuarioGetResponse = new Usuario();

            usuarioGetResponse.UsuarioId = reader.GetGuid("usuario_id");
            usuarioGetResponse.Username = reader.GetString("username");
            usuarioGetResponse.Senha = reader.GetString("senha");
            usuarioGetResponse.Nome = reader.GetString("nome");
            usuarioGetResponse.Perfil = (PerfilUsuario)reader.GetInt32("perfil");
            usuarioGetResponse.CadastroCompleto = reader.GetBoolean("cadastro_completo");
            usuarioGetResponse.JornadaUsuario = (JornadaUsuario)reader.GetInt32("jornada_usuario");

            return usuarioGetResponse;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<UsuarioGetResponse>> Obter(UsuarioGetRequest request)
    {
        var usuarios = new List<UsuarioGetResponse>();

        string sql = @"
            SELECT
                usuario_id,
                username,
                nome,
                perfil,
                cadastro_completo,
                jornada_usuario
            FROM
                pedido_certo_ai.usuario
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(request.Username)) sql += " AND username ILIKE @username";

        if (request.CadastroCompleto != null) sql += " AND cadastro_completo = @cadastro_completo";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "nome asc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("username", NpgsqlDbType.Varchar).Value = $"%{request.Username ?? string.Empty}%";
            cmd.Parameters.Add("cadastro_completo", NpgsqlDbType.Boolean).Value = request.CadastroCompleto ?? (object)DBNull.Value;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var usuarioGetResponse = new UsuarioGetResponse();
                usuarioGetResponse.UsuarioId = reader.GetGuid("usuario_id");
                usuarioGetResponse.Username = reader.GetString("username");
                usuarioGetResponse.Nome = reader.GetString("nome");
                usuarioGetResponse.Perfil = (PerfilUsuario)reader.GetInt32("perfil");
                usuarioGetResponse.CadastroCompleto = reader.GetBoolean("cadastro_completo");
                usuarioGetResponse.JornadaUsuario = (JornadaUsuario)reader.GetInt32("jornada_usuario");
                usuarios.Add(usuarioGetResponse);
            }

            return usuarios;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<Usuario>> ObterAdmins()
    {
        var usuarios = new List<Usuario>();

        const string sql = @"
            SELECT
                usuario_id,
                username,
                senha,
                nome,
                perfil,
                cadastro_completo,
                jornada_usuario
            FROM
                pedido_certo_ai.usuario
            WHERE
                perfil = @perfil
            AND
                cadastro_completo = true
            ORDER BY
                nome ASC;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);
            cmd.Parameters.Add("perfil", NpgsqlDbType.Integer).Value = (int)PerfilUsuario.Admin;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                usuarios.Add(new Usuario
                {
                    UsuarioId = reader.GetGuid("usuario_id"),
                    Username = reader.GetString("username"),
                    Senha = reader.GetString("senha"),
                    Nome = reader.GetString("nome"),
                    Perfil = (PerfilUsuario)reader.GetInt32("perfil"),
                    CadastroCompleto = reader.GetBoolean("cadastro_completo"),
                    JornadaUsuario = (JornadaUsuario)reader.GetInt32("jornada_usuario")
                });
            }

            return usuarios;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarUsuarioExiste(string username, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.usuario
            WHERE
                username = @username
            AND
                usuario_id <> @ignoreId
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("username", NpgsqlDbType.Varchar).Value = username;
            cmd.Parameters.Add("ignoreId", NpgsqlDbType.Uuid).Value = ignoreId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Excluir(Guid usuarioId)
    {
        const string sql = "DELETE FROM pedido_certo_ai.usuario WHERE usuario_id = @usuario_id";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlDbType.Uuid).Value = usuarioId;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> ValidarAcesso(Guid usuarioId)
    {
        const string sql = @"
            UPDATE pedido_certo_ai.usuario
            SET
                perfil = @perfil,
                cadastro_completo = true,
                jornada_usuario = @jornada_usuario
            WHERE usuario_id = @usuario_id
        ";

        try
        {
            await EnsureOpenAsync();

            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("usuario_id", NpgsqlDbType.Uuid).Value = usuarioId;
            cmd.Parameters.Add("perfil", NpgsqlDbType.Integer).Value = (int)PerfilUsuario.Normal;
            cmd.Parameters.Add("jornada_usuario", NpgsqlDbType.Integer).Value = (int)JornadaUsuario.Completed;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }
}