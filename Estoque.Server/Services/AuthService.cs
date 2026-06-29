using Estoque.Server.Exceptions;
using Estoque.Server.Models;
using Estoque.Server.Repositories;
using Estoque.Server.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Estoque.Server.Services;

public class AuthService : BaseService
{
    private readonly AuthRepository _authRepository;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public AuthService(AuthRepository authRepository, IConfiguration configuration, IPasswordHasher<Usuario> passwordHasher)
    {
        _authRepository = authRepository;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthLoginResponse> Login(Auth auth)
    {
        try
        {
            ValidarAuth(auth);

            var usuario = await _authRepository.ObterUsername(auth.Username, auth.UnidadeOrganizacionalId!.Value);

            if (usuario == null)
                throw new UnauthorizedAccessException("Usuário não encontrado para a unidade organizacional informada.");

            var verificacaoSenha = _passwordHasher.VerifyHashedPassword(usuario, usuario.Senha, auth.Senha);

            if (verificacaoSenha == PasswordVerificationResult.Failed)
                throw new UnauthorizedAccessException("Usuário ou senha incorretos.");

            if (usuario.CadastroCompleto)
            {
                if (usuario.JornadaUsuario != JornadaUsuario.Completed)
                {
                    await _authRepository.AtualizarJornadaUsuario(usuario.UsuarioId, JornadaUsuario.Completed);
                    usuario.JornadaUsuario = JornadaUsuario.Completed;
                }

                return new AuthLoginResponse
                {
                    Token = GerarTokenJwt(usuario)
                };
            }

            if (usuario.JornadaUsuario == JornadaUsuario.CodeValidatePage)
            {
                return new AuthLoginResponse
                {
                    JornadaUsuario = usuario.JornadaUsuario,
                    Message = "Valide o código de 6 dígitos enviado."
                };
            }

            if (usuario.JornadaUsuario == JornadaUsuario.WaitingApprovalPage)
            {
                return new AuthLoginResponse
                {
                    JornadaUsuario = JornadaUsuario.WaitingApprovalPage,
                    Message = "Isso pode levar até algumas horas."
                };
            }

            return new AuthLoginResponse
            {
                JornadaUsuario = JornadaUsuario.WaitingApprovalPage,
                Message = "Isso pode levar até algumas horas."
            };
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (ForbiddenException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao realizar login: {ex.Message}");
        }
    }

    private string GerarTokenJwt(Usuario usuario)
    {
        var tokenHandler = new JwtSecurityTokenHandler();

        var keyString = Environment.GetEnvironmentVariable("zenite_jwt_auth") ?? throw new InvalidOperationException("A variável de ambiente zenite_jwt_auth não foi encontrada ou configurada.");

        var key = Encoding.ASCII.GetBytes(keyString);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
                new Claim(ClaimTypes.Name, usuario.Username),
                new Claim("UnidadeOrganizacionalId", usuario.UnidadeOrganizacionalId.ToString()!),
                new Claim(ClaimTypes.Role, usuario.Perfil.ToString()),
                new Claim("CadastroCompleto", usuario.CadastroCompleto.ToString()),
                new Claim("JornadaUsuario", usuario.JornadaUsuario.ToString())
            }),
            Expires = DateTimeHelper.SaoPaulo().AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task EsquecerSenha(Auth auth)
    {
        try
        {
            ValidarAuthForgot(auth);

            var usuario = await _authRepository.ObterUsername(auth.Username, auth.UnidadeOrganizacionalId!.Value);

            if (usuario == null)
                throw new NotFoundException("Usuário não encontrado para a unidade organizacional informada.");

            var existeCodigoEmCooldown = await _authRepository.BuscarUltimoCodigo(usuario.UsuarioId, DateTime.MinValue, 5, 2);
            if (existeCodigoEmCooldown)
                throw new InvalidOperationException("Aguarde 5 minutos para solicitar um novo código de recuperação.");

            string codigoGerado = new Random().Next(100000, 999999).ToString();

            await _authRepository.InserirCodigoAcesso(usuario.UsuarioId, codigoGerado);
        }
        catch (ValidationException)
        {
            throw;
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
            throw new Exception($"Erro ao solicitar recuperação: {ex.Message}");
        }
    }

    public async Task ReenviarCodigoCadastro(Auth auth)
    {
        try
        {
            ValidarAuthForgot(auth);

            var usuario = await _authRepository.ObterUsername(auth.Username, auth.UnidadeOrganizacionalId!.Value);

            if (usuario == null)
                throw new NotFoundException("Usuário não encontrado.");

            if (usuario.JornadaUsuario != JornadaUsuario.CodeValidatePage)
                throw new InvalidOperationException("Este cadastro não está aguardando validação de código.");

            var existeCodigoEmCooldown = await _authRepository.BuscarUltimoCodigo(usuario.UsuarioId, DateTime.MinValue, 5, 2);
            if (existeCodigoEmCooldown)
                throw new InvalidOperationException("Aguarde 5 minutos para solicitar um novo código.");

            string codigoGerado = new Random().Next(100000, 999999).ToString();

            await _authRepository.InserirCodigoAcesso(usuario.UsuarioId, codigoGerado);
        }
        catch (ValidationException)
        {
            throw;
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
            throw new Exception($"Erro ao reenviar código de cadastro: {ex.Message}");
        }
    }

    public async Task<AuthVerifyResponse> VerificarCodigo(AuthVerify auth)
    {
        try
        {
            ValidarAuthVerify(auth);

            Usuario? usuario = null;
            if (!string.IsNullOrWhiteSpace(auth.Username) && auth.UnidadeOrganizacionalId.HasValue)
                usuario = await _authRepository.ObterUsername(auth.Username, auth.UnidadeOrganizacionalId.Value);

            var codigoAcesso = await _authRepository.ObterCodigoPorSms(auth.Code, usuario?.UsuarioId);

            if (codigoAcesso == null)
                throw new NotFoundException("Código não encontrado.");

            if (codigoAcesso.Utilizado)
                throw new InvalidOperationException("Este código já foi utilizado.");

            if (DateTimeHelper.SaoPaulo() > codigoAcesso.DataSolicitacao.AddMinutes(5))
                throw new InvalidOperationException("O tempo de validação deste código expirou.");

            bool existeMaisRecente = await _authRepository.BuscarUltimoCodigo(codigoAcesso.UsuarioId, codigoAcesso.DataSolicitacao);
            if (existeMaisRecente)
                throw new InvalidOperationException("Este código foi invalidado porque uma nova solicitação foi feita.");

            usuario ??= await _authRepository.ObterUsuario(codigoAcesso.UsuarioId);

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

            string codigoResetId = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLower();

            await _authRepository.AtualizarCodigoValidado(codigoAcesso.UsuarioId, codigoAcesso.Codigo, codigoResetId);

            return new AuthVerifyResponse
            {
                CodigoResetId = codigoResetId
            };
        }
        catch (InvalidOperationException)
        {
            throw;
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
            throw new Exception($"Erro ao verificar código: {ex.Message}");
        }
    }

    public async Task RedefinirSenha(AuthReset auth)
    {
        try
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

            var DummyUsuario = new Usuario { UsuarioId = codigoAcesso.UsuarioId };

            var hashedSenha = _passwordHasher.HashPassword(DummyUsuario, auth.Senha);

            await _authRepository.RedefinirSenha(codigoAcesso.UsuarioId, hashedSenha);

            await _authRepository.MarcarResetEfetuado(codigoAcesso.CodigoResetId!);
        }
        catch (InvalidOperationException)
        {
            throw;
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
            throw new Exception($"Erro ao redefinir senha: {ex.Message}");
        }
    }

    private void ValidarAuth(Auth auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Username))
            AddError(nameof(auth.Username), "Informe o username.");

        if (string.IsNullOrWhiteSpace(auth.Senha))
            AddError(nameof(auth.Senha), "Informe a senha.");

        if (auth.UnidadeOrganizacionalId == null || auth.UnidadeOrganizacionalId == Guid.Empty)
            AddError(nameof(auth.UnidadeOrganizacionalId), "Informe a unidade organizacional.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarAuthForgot(Auth auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Username))
            AddError(nameof(auth.Username), "Informe o username.");

        if (auth.UnidadeOrganizacionalId == null || auth.UnidadeOrganizacionalId == Guid.Empty)
            AddError(nameof(auth.UnidadeOrganizacionalId), "Informe a unidade organizacional.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarAuthVerify(AuthVerify auth)
    {
        if (string.IsNullOrWhiteSpace(auth.Code))
            AddError(nameof(auth.Code), "Informe o código.");

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
