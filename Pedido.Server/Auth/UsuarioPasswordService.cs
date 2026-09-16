using Microsoft.AspNetCore.Identity;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Server.AuthServices;

public class UsuarioPasswordService : IUsuarioPasswordService
{
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public UsuarioPasswordService(IPasswordHasher<Usuario> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public string HashPassword(Usuario usuario, string senha)
    {
        return _passwordHasher.HashPassword(usuario, senha);
    }
}
