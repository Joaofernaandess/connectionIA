using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using System.Security.Cryptography;

namespace Pedido.Domain.Services;

public class AuthService : BaseService
{
    private readonly IAuthRepository _authRepository;
    private readonly IAuthPasswordService _passwordService;
    private readonly IAuthTokenService _tokenService;
    private readonly IAuthNotificationService _notificationService;

    public AuthService(
        IAuthRepository authRepository,
        IAuthPasswordService passwordService,
        IAuthTokenService tokenService,
        IAuthNotificationService notificationService)
    {
        _authRepository = authRepository;
        _passwordService = passwordService;
        _tokenService = tokenService;
        _notificationService = notificationService;
    }

    public async Task<AuthToken> Login(Auth auth)
    {
        ValidarAuth(auth);

        var usuario = await _authRepository.ObterUsername(auth.Username);

        if (usuario == null)
            throw new UnauthorizedAccessException("Usuário não encontrado.");

        if (!_passwordService.VerifyHashedPassword(usuario, usuario.Senha, auth.Senha))
            throw new UnauthorizedAccessException("Usuário ou senha incorreta.");

        if (usuario.CadastroCompleto)
        {
            if (usuario.JornadaUsuario != JornadaUsuario.Completed)
            {
                await _authRepository.AtualizarJornadaUsuario(usuario.UsuarioId, JornadaUsuario.Completed);
                usuario.JornadaUsuario = JornadaUsuario.Completed;
            }

            return new AuthToken
            {
                Token = _tokenService.GerarToken(usuario)
            };
        }

        if (usuario.JornadaUsuario == JornadaUsuario.CodeValidatePage)
        {
            return new AuthToken
            {
                JornadaUsuario = usuario.JornadaUsuario,
                Message = "Valide o código de 6 dígitos enviado."
            };
        }

        if (usuario.JornadaUsuario == JornadaUsuario.WaitingApprovalPage)
        {
            return new AuthToken
            {
                JornadaUsuario = JornadaUsuario.WaitingApprovalPage,
                Message = "Isso pode levar até algumas horas."
            };
        }

        return new AuthToken
        {
            JornadaUsuario = JornadaUsuario.WaitingApprovalPage,
            Message = "Isso pode levar até algumas horas."
        };
    }

    public async Task EsquecerSenha(Auth auth)
    {
        ValidarAuthForgot(auth);

        var usuario = await _authRepository.ObterUsername(auth.Username);

        if (usuario == null)
            throw new NotFoundException("Usuário não encontrado.");

        var existeCodigoEmCooldown = await _authRepository.BuscarUltimoCodigo(usuario.UsuarioId, DateTime.MinValue, 2, 2);
        if (existeCodigoEmCooldown)
            throw new InvalidOperationException("Aguarde 2 minutos para solicitar um novo código de recuperação.");

        string codigoGerado = GerarCodigoAcesso();

        await _authRepository.InserirCodigoAcesso(usuario.UsuarioId, codigoGerado);
        await _notificationService.EnviarCodigoAcessoAsync(usuario.Username, codigoGerado);
    }

    public async Task ReenviarCodigoCadastro(Auth auth)
    {
        ValidarAuthForgot(auth);

        var usuario = await _authRepository.ObterUsername(auth.Username);

        if (usuario == null)
            throw new NotFoundException("Usuário não encontrado.");

        if (usuario.CadastroCompleto)
            throw new InvalidOperationException("O acesso do usuário já está validado.");

        if (usuario.JornadaUsuario != JornadaUsuario.CodeValidatePage)
            throw new InvalidOperationException("O cadastro deste usuário não está aguardando validação de código.");

        var existeCodigoEmCooldown = await _authRepository.BuscarUltimoCodigo(usuario.UsuarioId, DateTime.MinValue, 2, 2);
        if (existeCodigoEmCooldown)
            throw new InvalidOperationException("Aguarde 2 minutos para solicitar um novo código.");

        string codigoGerado = GerarCodigoAcesso();

        await _authRepository.InserirCodigoAcesso(usuario.UsuarioId, codigoGerado);
        await _notificationService.EnviarCodigoAcessoAsync(usuario.Username, codigoGerado);
    }

    public async Task<AuthVerifyResponse> VerificarCodigo(AuthVerify auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Code))
            throw new InvalidOperationException("Informe o código.");

        var codigoAcesso = await _authRepository.ObterCodigoPorSms(auth.Code);

        if (codigoAcesso == null)
            throw new NotFoundException("Código não encontrado.");

        if (codigoAcesso.Utilizado)
            throw new InvalidOperationException("Este código já foi utilizado.");

        if (DateTimeHelper.SaoPaulo() > codigoAcesso.DataSolicitacao.AddMinutes(5))
            throw new InvalidOperationException("O tempo de validação deste código expirou.");

        bool existeMaisRecente = await _authRepository.BuscarUltimoCodigo(codigoAcesso.UsuarioId, codigoAcesso.DataSolicitacao);
        if (existeMaisRecente)
            throw new InvalidOperationException("Este código foi invalidado porque uma nova solicitação foi feita.");

        var usuario = await _authRepository.ObterUsername(auth.Username);

        if (usuario?.JornadaUsuario == JornadaUsuario.CodeValidatePage)
        {
            await _authRepository.AtualizarCodigoCadastroValidado(codigoAcesso.UsuarioId, codigoAcesso.Codigo);
            await _authRepository.AtualizarJornadaUsuario(codigoAcesso.UsuarioId, JornadaUsuario.WaitingApprovalPage);

            return new AuthVerifyResponse
            {
                JornadaUsuario = JornadaUsuario.WaitingApprovalPage,
                Message = "Código validado com sucesso."
            };
        }

        string codigoResetId = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();

        await _authRepository.AtualizarCodigoValidado(codigoAcesso.UsuarioId, codigoAcesso.Codigo, codigoResetId);

        return new AuthVerifyResponse
        {
            CodigoAcessoId = codigoResetId,
            CodigoResetId = codigoResetId
        };
    }

    public async Task RedefinirSenha(AuthReset auth)
    {
        if (string.IsNullOrWhiteSpace(auth.CodigoAcessoId))
            throw new InvalidOperationException("Código de acesso não informado.");

        ValidarAuthReset(auth);

        var codigoAcesso = await _authRepository.ObterCodigoPorId(auth.CodigoAcessoId);

        if (codigoAcesso == null)
            throw new NotFoundException("Código de acesso inválido ou não encontrado.");

        if (!codigoAcesso.Utilizado)
            throw new InvalidOperationException("Este código não foi validado. Volte e informe os 6 dígitos primeiro.");

        if (codigoAcesso.ResetEfetuado)
            throw new InvalidOperationException("Este código de acesso já foi utilizado.");

        if (codigoAcesso.DataResetId.HasValue && DateTimeHelper.SaoPaulo() > codigoAcesso.DataResetId.Value.AddMinutes(5))
            throw new InvalidOperationException("O tempo limite para utilizar este código expirou. Solicite um novo código.");

        bool existeMaisRecente = await _authRepository.BuscarUltimoCodigo(codigoAcesso.UsuarioId, codigoAcesso.DataSolicitacao);
        if (existeMaisRecente)
            throw new InvalidOperationException("Esta sessão expirou porque um novo código foi solicitado recentemente.");

        var usuario = new AuthUsuario { UsuarioId = codigoAcesso.UsuarioId };
        var hashedSenha = _passwordService.HashPassword(usuario, auth.Senha);

        await _authRepository.RedefinirSenha(codigoAcesso.UsuarioId, hashedSenha);
        await _authRepository.MarcarResetEfetuado(codigoAcesso.CodigoResetId!);
    }

    private static string GerarCodigoAcesso()
    {
        return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    }

    private void ValidarAuth(Auth auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Username))
            AddError(nameof(auth.Username), "Informe o username.");

        if (string.IsNullOrWhiteSpace(auth.Senha))
            AddError(nameof(auth.Senha), "Informe a senha.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarAuthForgot(Auth auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Username))
            AddError(nameof(auth.Username), "Informe o username.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarAuthReset(AuthReset auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Senha))
            AddError(nameof(auth.Senha), "Informe a nova senha.");

        if (string.IsNullOrWhiteSpace(auth.ConfirmaSenha))
            AddError(nameof(auth.ConfirmaSenha), "Confirme a nova senha.");

        if (!string.IsNullOrWhiteSpace(auth.Senha)
            && !string.IsNullOrWhiteSpace(auth.ConfirmaSenha)
            && auth.Senha != auth.ConfirmaSenha)
            AddError(nameof(auth.ConfirmaSenha), "A senha e a confirmação não são iguais.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}