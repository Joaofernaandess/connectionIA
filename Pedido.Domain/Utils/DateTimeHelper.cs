namespace Pedido.Domain.Utils;

public static class DateTimeHelper
{
    public static DateTime SaoPaulo()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow.AddHours(-3), DateTimeKind.Unspecified);
    }
}
