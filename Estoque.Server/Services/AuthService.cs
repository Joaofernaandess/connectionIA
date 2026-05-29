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

    public async Task<AuthToken> Login(Auth auth)
    {
        try
        {
            ValidarAuth(auth);

            var usuario = await _authRepository.ObterUsername(auth.Username, auth.UnidadeOrganizacionalId!.Value);

            if (usuario == null)
                throw new UnauthorizedAccessException("Usuário não encontrado para a unidade organizacional informada.");

            var verificacaoSenha = _passwordHasher.VerifyHashedPassword(usuario, usuario.Senha, auth.Senha);

            if (verificacaoSenha == PasswordVerificationResult.Failed)
                throw new UnauthorizedAccessException("Usuário ou senha incorreta.");

            if (!usuario.Valido)
                throw new ForbiddenException("Usuário não validado.");

            return new AuthToken
            {
                Token = GerarTokenJwt(usuario)
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
                new Claim("Valido", usuario.Valido.ToString())
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
                throw new NotFoundException("Usuário não encontrado.");

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
        catch (Exception ex)
        {
            throw new Exception($"Erro ao solicitar recuperação: {ex.Message}");
        }
    }

    public async Task<string> VerificarCodigo(AuthVerify auth)
    {
        try
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

            string codigoResetId = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLower();

            await _authRepository.AtualizarCodigoValidado(codigoAcesso.UsuarioId, codigoAcesso.Codigo, codigoResetId);

            return codigoResetId;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (NotFoundException)
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

            if (string.IsNullOrWhiteSpace(auth.Senha))
                throw new InvalidOperationException("Informe a nova senha.");

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
}