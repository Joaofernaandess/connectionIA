namespace Estoque.Server.Utils;

public static class DateTimeHelper
{
    public static DateTime AgoraBrasilia()
    {
        return SaoPaulo();
    }

    public static DateTime SaoPaulo()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow.AddHours(-3), DateTimeKind.Unspecified);
    }

    public static DateTime AgoraUtc()
    {
        return DateTime.UtcNow;
    }
}
