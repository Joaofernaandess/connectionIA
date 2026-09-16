using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<Guid> Cadastrar(Usuario usuario);
    Task<int> Atualizar(UsuarioPutRequest usuario, Guid usuarioId);
    Task<Usuario?> Obter(Guid usuarioId);
    Task<List<UsuarioGetResponse>> Obter(UsuarioGetRequest request);
    Task<List<Usuario>> ObterAdmins();
    Task<bool> VerificarUsuarioExiste(string username, Guid ignoreId);
    Task<int> Excluir(Guid usuarioId);
    Task<int> ValidarAcesso(Guid usuarioId);
}