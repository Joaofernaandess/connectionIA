namespace Pedido.Domain.Models.Shared
{
    public class HistoricoLog
    {
        public Guid HistoricoId { get; set; }
        public Guid EntidadeId { get; set; }
        public string TipoEntidade { get; set; }
        public Guid? UsuarioId { get; set; }
        public string NomeUsuario { get; set; }
        public string Descricao { get; set; }
        public DateTime DataHora { get; set; }

        public HistoricoLog() { }

        public HistoricoLog(Guid entidadeId, string tipoEntidade, Guid? usuarioId, string nomeUsuario, string descricao)
        {
            HistoricoId = Guid.NewGuid();
            EntidadeId = entidadeId;
            TipoEntidade = tipoEntidade;
            UsuarioId = usuarioId;
            NomeUsuario = nomeUsuario;
            Descricao = descricao;
            DataHora = DateTime.UtcNow;
        }
    }
}