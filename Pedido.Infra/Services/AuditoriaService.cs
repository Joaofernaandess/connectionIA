using Pedido.Domain.Interfaces.Shared;
using Pedido.Domain.Utils;
using Serilog;
using System.Reflection;

namespace Pedido.Infra.Services
{
    public class AuditoriaService : IAuditoriaService
    {
        public void RegistrarAlteracao<T>(Guid entidadeId, string tipoEntidade, Guid? usuarioId, string nomeUsuario, T estadoAntigo, T estadoNovo)
        {
            Type tipo = typeof(T);
            PropertyInfo[] propriedades = tipo.GetProperties();

            foreach (var prop in propriedades)
            {
                // O SEGREDO: Só audita propriedades que tenham a tag [LogDescription]!
                // Isso ignora automaticamente Listas, Datas de criação e IDs internos não mapeados.
                var atributo = prop.GetCustomAttribute<LogDescriptionAttribute>();
                if (atributo == null)
                    continue;

                var valorAntigo = prop.GetValue(estadoAntigo);
                var valorNovo = prop.GetValue(estadoNovo);

                // Se não mudou, pula
                if (Equals(valorAntigo, valorNovo))
                    continue;

                string nomeCampo = atributo.Descricao;
                string descricaoLog = $"alterou {nomeCampo} de '{valorAntigo ?? "vazio"}' para '{valorNovo ?? "vazio"}'";

                Log.ForContext("EntidadeId", entidadeId)
                   .ForContext("TipoEntidade", tipoEntidade)
                   .ForContext("UsuarioId", usuarioId)
                   .ForContext("NomeUsuario", nomeUsuario)
                   .Information(descricaoLog);
            }
        }
    }
}