namespace Estoque.Server.Models;

public class EncryptedRequest
{
    public string Key { get; set; } = string.Empty;
    public string Iv { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
}