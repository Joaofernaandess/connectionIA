using Estoque.Server.Exceptions;
using Estoque.Server.Models;
using Estoque.Server.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Estoque.Server.Services;

public class UsuarioService : BaseService
{
    private readonly UsuarioRepository _usuarioRepository;
    private readonly UnidadeOrganizacionalRepository _unidadeOrganizacionalRepository;
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public UsuarioService(UsuarioRepository usuarioRepository, UnidadeOrganizacionalRepository unidadeOrganizacionalRepository, IPasswordHasher<Usuario> passwordHasher)
    {
        _usuarioRepository = usuarioRepository;
        _unidadeOrganizacionalRepository = unidadeOrganizacionalRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> Cadastrar(Usuario usuario)
    {
        try
        {
            await ValidarCampos(usuario, Guid.Empty);

            usuario.Perfil = PerfilUsuario.Normal;
            usuario.Senha = _passwordHasher.HashPassword(usuario, usuario.Senha);

            return await _usuarioRepository.Cadastrar(usuario);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar usuário: {ex.Message}");
        }
    }

    public async Task Atualizar(UsuarioPutRequest usuario, Guid usuarioId)
    {
        try
        {
            ValidarCamposAtualizacao(usuario);

            string senhaHash = string.Empty;

            if (!string.IsNullOrWhiteSpace(usuario.Senha))
            {
                var usuarioHash = new Usuario { UsuarioId = usuarioId };
                senhaHash = _passwordHasher.HashPassword(usuarioHash, usuario.Senha);
            }

            var affected = await _usuarioRepository.Atualizar(usuario, usuarioId, senhaHash);

            if (affected <= 0) throw new NotFoundException("Usuário não encontrado com os parâmetros informados.");
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao atualizar usuário: {ex.Message}");
        }
    }

    public async Task ValidarAcesso(Guid usuarioId)
    {
        try
        {
            var usuario = await _usuarioRepository.Obter(usuarioId);

            if (usuario == null) throw new NotFoundException("Usuário não encontrado com o ID informado.");

            if (usuario.Valido) throw new InvalidOperationException("O acesso do usuário já está validado.");

            await _usuarioRepository.ValidarAcesso(usuarioId);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao validar acesso do usuário: {ex.Message}");
        }
    }

    public async Task Excluir(Guid usuarioId)
    {
        try
        {
            var affected = await _usuarioRepository.Excluir(usuarioId);

            if (affected <= 0) throw new NotFoundException("Usuário não encontrado com o ID informado.");
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao excluir usuário: {ex.Message}");
        }
    }

    public async Task<List<UsuarioGetResponse>> Obter(int skip, int top, string? username, Guid? unidadeOrganizacionalId, bool? valido = null)
    {
        try
        {
            return await _usuarioRepository.Obter(skip, top, username, unidadeOrganizacionalId, valido);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter usuários: {ex.Message}");
        }
    }

    public async Task<Usuario> Obter(Guid usuarioId)
    {
        try
        {
            var usuario = await _usuarioRepository.Obter(usuarioId);

            if (usuario == null) throw new NotFoundException("Usuário não encontrado com o ID informado.");

            return usuario;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter usuário por ID: {ex.Message}");
        }
    }

    private async Task ValidarCampos(Usuario usuario, Guid usuarioId)
    {
        if (usuario.UnidadeOrganizacionalId == null || usuario.UnidadeOrganizacionalId == Guid.Empty)
        {
            AddError(nameof(usuario.UnidadeOrganizacionalId), "Informe a unidade organizacional.");
        }
        else
        {
            var unidadeOrganizacionalExiste = await _unidadeOrganizacionalRepository.Obter(usuario.UnidadeOrganizacionalId.Value);

            if (unidadeOrganizacionalExiste == null)
                AddError(nameof(usuario.UnidadeOrganizacionalId), "Unidade organizacional não encontrada.");
        }

        if (string.IsNullOrWhiteSpace(usuario.Username))
        {
            AddError(nameof(usuario.Username), "Informe o username");
        }
        else
        {
            var usernameExiste = await _usuarioRepository.VerificarUsuarioExiste(usuario.Username, usuario.UnidadeOrganizacionalId, usuarioId);

            if (usernameExiste)
                AddError(nameof(usuario.Username), "Este username já está sendo utilizado.");
        }

        if (string.IsNullOrWhiteSpace(usuario.Senha))
            AddError(nameof(usuario.Senha), "Informe a senha.");

        if (string.IsNullOrWhiteSpace(usuario.Nome))
            AddError(nameof(usuario.Nome), "Informe o nome.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarCamposAtualizacao(UsuarioPutRequest usuario)
    {
        if (string.IsNullOrWhiteSpace(usuario.Nome))
            AddError(nameof(usuario.Nome), "Informe o nome.");

        var senhaInformada = !string.IsNullOrWhiteSpace(usuario.Senha);
        var confirmaSenhaInformada = !string.IsNullOrWhiteSpace(usuario.ConfirmaSenha);

        if (senhaInformada || confirmaSenhaInformada)
        {
            if (string.IsNullOrWhiteSpace(usuario.Senha))
                AddError(nameof(usuario.Senha), "Informe a senha.");

            if (string.IsNullOrWhiteSpace(usuario.ConfirmaSenha))
                AddError(nameof(usuario.ConfirmaSenha), "Confirme a senha.");

            if (!string.IsNullOrWhiteSpace(usuario.Senha) &&
                !string.IsNullOrWhiteSpace(usuario.ConfirmaSenha) &&
                usuario.Senha != usuario.ConfirmaSenha)
                AddError(nameof(usuario.ConfirmaSenha), "As senhas não coincidem.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}