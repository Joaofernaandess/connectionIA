using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Estoque.Server.Services;

public class PayloadCryptoService : IDisposable
{
    private readonly RSA _rsa = RSA.Create(2048);
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public PayloadCryptoService()
    {
        var privateKey = Environment.GetEnvironmentVariable("encrypt_private_key");

        if (string.IsNullOrWhiteSpace(privateKey))
            throw new InvalidOperationException("A variável de ambiente encrypt_private_key não foi encontrada ou configurada.");

        var privateKeyBytes = Convert.FromBase64String(privateKey);
        _rsa.ImportPkcs8PrivateKey(privateKeyBytes, out _);
    }

    public T Descriptografar<T>(string payload)
    {
        return Descriptografar<T>(new Models.EncryptedRequest
        {
            Payload = payload
        });
    }

    public T Descriptografar<T>(Models.EncryptedRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Payload))
            throw new InvalidOperationException("Payload criptografado não informado.");

        try
        {
            var decryptedBytes = string.IsNullOrWhiteSpace(request.Key) || string.IsNullOrWhiteSpace(request.Iv)
                ? DecryptRsaPayload(request.Payload)
                : DecryptHybridPayload(request);

            var json = Encoding.UTF8.GetString(decryptedBytes);

            return JsonSerializer.Deserialize<T>(json, _jsonOptions)
                ?? throw new InvalidOperationException("Payload criptografado inválido.");
        }
        catch (CryptographicException)
        {
            throw new InvalidOperationException("Payload criptografado inválido.");
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Payload criptografado inválido.");
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("Payload criptografado inválido.");
        }
    }

    public Models.EncryptedResponse CriptografarResposta(Models.EncryptedRequest request, object response)
    {
        if (string.IsNullOrWhiteSpace(request.Key))
            throw new InvalidOperationException("Chave criptografada não informada.");

        try
        {
            var key = DecryptHybridKey(request);
            var iv = RandomNumberGenerator.GetBytes(12);
            var plainText = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(response, _jsonOptions));
            var cipherText = new byte[plainText.Length];
            var tag = new byte[16];

            using var aes = new AesGcm(key, tag.Length);
            aes.Encrypt(iv, plainText, cipherText, tag);

            return new Models.EncryptedResponse
            {
                Iv = Convert.ToBase64String(iv),
                Payload = Convert.ToBase64String(cipherText.Concat(tag).ToArray())
            };
        }
        catch (CryptographicException)
        {
            throw new InvalidOperationException("Não foi possível criptografar a resposta.");
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Não foi possível criptografar a resposta.");
        }
    }

    private byte[] DecryptRsaPayload(string payload)
    {
        var encryptedBytes = Convert.FromBase64String(payload);
        return _rsa.Decrypt(encryptedBytes, RSAEncryptionPadding.OaepSHA256);
    }

    private byte[] DecryptHybridPayload(Models.EncryptedRequest request)
    {
        var key = DecryptHybridKey(request);
        var iv = Convert.FromBase64String(request.Iv);
        var payloadBytes = Convert.FromBase64String(request.Payload);

        const int tagSize = 16;
        if (payloadBytes.Length <= tagSize)
            throw new InvalidOperationException("Payload criptografado inválido.");

        var cipherTextLength = payloadBytes.Length - tagSize;
        var cipherText = payloadBytes[..cipherTextLength];
        var tag = payloadBytes[cipherTextLength..];
        var plainText = new byte[cipherTextLength];

        using var aes = new AesGcm(key, tagSize);
        aes.Decrypt(iv, cipherText, tag, plainText);

        return plainText;
    }

    private byte[] DecryptHybridKey(Models.EncryptedRequest request)
    {
        var encryptedKey = Convert.FromBase64String(request.Key);
        return _rsa.Decrypt(encryptedKey, RSAEncryptionPadding.OaepSHA256);
    }

    public void Dispose()
    {
        _rsa.Dispose();
    }
}