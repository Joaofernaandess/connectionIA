using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Security.Cryptography;

namespace Pedido.Domain.Services;

public class UsuarioService : BaseService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IUsuarioPasswordService _passwordService;
    private readonly IAuthNotificationService _notificationService;

    public UsuarioService(
        IUsuarioRepository usuarioRepository,
        IAuthRepository authRepository,
        IUsuarioPasswordService passwordService,
        IAuthNotificationService notificationService)
    {
        _usuarioRepository = usuarioRepository;
        _authRepository = authRepository;
        _passwordService = passwordService;
        _notificationService = notificationService;
    }

    public async Task<Guid> Cadastrar(Usuario usuario)
    {
        try
        {
            await ValidarCampos(usuario, Guid.Empty);

            usuario.Perfil = PerfilUsuario.Normal;
            usuario.CadastroCompleto = false;
            usuario.JornadaUsuario = JornadaUsuario.CodeValidatePage;
            usuario.Senha = _passwordService.HashPassword(usuario, usuario.Senha);

            var usuarioId = await _usuarioRepository.Cadastrar(usuario);

            string codigoGerado = GerarCodigoAcesso();

            await _authRepository.InserirCodigoAcesso(usuarioId, codigoGerado);
            await _notificationService.EnviarCodigoAcessoAsync(usuario.Username, codigoGerado);

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

    public async Task Atualizar(UsuarioPutRequest usuario, Guid usuarioId)
    {
        try
        {
            ValidarCamposAtualizacao(usuario);

            var affected = await _usuarioRepository.Atualizar(usuario, usuarioId);

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

    public async Task<List<UsuarioGetResponse>> Obter(UsuarioGetRequest request)
    {
        try
        {
            return await _usuarioRepository.Obter(request);
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
        if (string.IsNullOrWhiteSpace(usuario.Username))
        {
            AddError(nameof(usuario.Username), "Informe o username");
        }
        else
        {
            var usernameExiste = await _usuarioRepository.VerificarUsuarioExiste(usuario.Username, usuarioId);

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

    private void ValidarCamposAtualizacao(UsuarioPutRequest usuario)
    {
        if (string.IsNullOrWhiteSpace(usuario.Nome))
            AddError(nameof(usuario.Nome), "Informe o nome.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private static string GerarCodigoAcesso()
    {
        return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    }
}