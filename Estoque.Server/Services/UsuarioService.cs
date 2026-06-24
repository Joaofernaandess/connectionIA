using Estoque.Server.Exceptions;
using Estoque.Server.Models;
using Estoque.Server.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Estoque.Server.Services;

public class UsuarioService : BaseService
{
    private readonly UsuarioRepository _usuarioRepository;
    private readonly UnidadeOrganizacionalRepository _unidadeOrganizacionalRepository;
    private readonly AuthRepository _authRepository;
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public UsuarioService(UsuarioRepository usuarioRepository, UnidadeOrganizacionalRepository unidadeOrganizacionalRepository, AuthRepository authRepository, IPasswordHasher<Usuario> passwordHasher)
    {
        _usuarioRepository = usuarioRepository;
        _unidadeOrganizacionalRepository = unidadeOrganizacionalRepository;
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> Cadastrar(Usuario usuario)
    {
        try
        {
            await ValidarCampos(usuario, Guid.Empty);

            usuario.Perfil = PerfilUsuario.Normal;
            usuario.CadastroCompleto = false;
            usuario.JornadaUsuario = JornadaUsuario.CodeValidatePage;
            usuario.Senha = _passwordHasher.HashPassword(usuario, usuario.Senha);

            var usuarioId = await _usuarioRepository.Cadastrar(usuario);

            string codigoGerado = new Random().Next(100000, 999999).ToString();
            await _authRepository.InserirCodigoAcesso(usuarioId, codigoGerado);

            return usuarioId;
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

    public async Task AtualizarNome(UsuarioPatchRequest usuario, Guid usuarioId)
    {
        try
        {
            ValidarCamposAtualizacaoNome(usuario);

            var affected = await _usuarioRepository.AtualizarNome(usuario, usuarioId);

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
            throw new Exception($"Erro ao atualizar nome do usuário: {ex.Message}");
        }
    }

    public async Task ValidarAcesso(Guid usuarioId)
    {
        try
        {
            var usuario = await _usuarioRepository.Obter(usuarioId);

            if (usuario == null) throw new NotFoundException("Usuário não encontrado com o ID informado.");

            if (usuario.CadastroCompleto) throw new InvalidOperationException("O acesso do usuário já está validado.");

            if (usuario.JornadaUsuario != JornadaUsuario.WaitingApprovalPage)
                throw new InvalidOperationException("O usuário ainda não concluiu a validação do código de cadastro.");

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

    public async Task<List<UsuarioGetResponse>> Obter(int skip, int top, string? username, Guid? unidadeOrganizacionalId, bool? cadastroCompleto = null)
    {
        try
        {
            return await _usuarioRepository.Obter(skip, top, username, unidadeOrganizacionalId, cadastroCompleto);
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

        if (string.IsNullOrWhiteSpace(usuario.ConfirmaSenha))
            AddError(nameof(usuario.ConfirmaSenha), "Confirme a senha.");

        if (!string.IsNullOrWhiteSpace(usuario.Senha) &&
            !string.IsNullOrWhiteSpace(usuario.ConfirmaSenha) &&
            usuario.Senha != usuario.ConfirmaSenha)
            AddError(nameof(usuario.ConfirmaSenha), "A senha e a confirmação não são iguais.");

        if (string.IsNullOrWhiteSpace(usuario.Nome))
            AddError(nameof(usuario.Nome), "Informe o nome.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarCamposAtualizacaoNome(UsuarioPatchRequest usuario)
    {
        if (string.IsNullOrWhiteSpace(usuario.Nome))
            AddError(nameof(usuario.Nome), "Informe o nome.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}