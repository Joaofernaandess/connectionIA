using Pedido.Domain.Models;

namespace Pedido.Domain.Interfaces;

public interface IAuditoriaService
{
    void RegistrarCadastro<T>(
        AuditoriaUsuario usuario,
        string entidade,
        Guid entidadeId,
        T novo);

    void RegistrarAlteracao<T>(
        AuditoriaUsuario usuario,
        string entidade,
        Guid entidadeId,
        T anterior,
        T novo);

    void RegistrarEvento(
        AuditoriaUsuario usuario,
        string acao,
        string entidade,
        Guid entidadeId,
        string descricao);
}
