using Microsoft.AspNetCore.Identity;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Server.AuthServices;

public class AuthPasswordService : IAuthPasswordService
{
    private readonly IPasswordHasher<AuthUsuario> _passwordHasher;

    public AuthPasswordService(IPasswordHasher<AuthUsuario> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public string HashPassword(AuthUsuario usuario, string senha)
    {
        return _passwordHasher.HashPassword(usuario, senha);
    }

    public bool VerifyHashedPassword(AuthUsuario usuario, string senhaHash, string senha)
    {
        return _passwordHasher.VerifyHashedPassword(usuario, senhaHash, senha) != PasswordVerificationResult.Failed;
    }
}
