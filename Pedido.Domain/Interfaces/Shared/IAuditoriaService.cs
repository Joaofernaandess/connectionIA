namespace Pedido.Domain.Interfaces.Shared
{
    public interface IAuditoriaService
    {
        void RegistrarAlteracao<T>(
            Guid entidadeId,
            string tipoEntidade,
            Guid? usuarioId,
            string nomeUsuario,
            T estadoAntigo,
            T estadoNovo);
    }
}