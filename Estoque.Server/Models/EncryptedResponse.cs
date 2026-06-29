namespace Estoque.Server.Models;

public class EncryptedResponse
{
    public string Iv { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
}