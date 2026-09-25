namespace Pedido.Domain.Utils
{
    [AttributeUsage(AttributeTargets.Property)]
    public class LogDescriptionAttribute : Attribute
    {
        public string Descricao { get; }
        public LogDescriptionAttribute(string descricao)
        {
            Descricao = descricao;
        }
    }
}