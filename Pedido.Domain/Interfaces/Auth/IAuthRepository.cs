using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IAuthRepository
{
    Task<AuthUsuario?> ObterUsername(string username);
    Task<CodigoAcesso?> ObterCodigoPorSms(string codigoSms);
    Task AtualizarCodigoValidado(Guid usuarioId, string codigoSms, string codigoResetId);
    Task<bool> BuscarUltimoCodigo(Guid usuarioId, DateTime dataSolicitacao, int? minutosCooldown = null, int quantidadeMinima = 1);
    Task<CodigoAcesso?> ObterCodigoPorId(string codigoResetId);
    Task InserirCodigoAcesso(Guid usuarioId, string codigo);
    Task<int> RedefinirSenha(Guid usuarioId, string novaSenha);
    Task<int> AtualizarJornadaUsuario(Guid usuarioId, JornadaUsuario jornadaUsuario);
    Task<int> ConcluirCadastro(Guid usuarioId);
    Task<int> AtualizarCodigoCadastroValidado(Guid usuarioId, string codigoSms);
    Task MarcarResetEfetuado(string codigoResetId);
}