using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Pedido.Domain.Interfaces;

namespace Pedido.Infra.Services;

public class FileStorageService : IPedidoFileStorageService
{
    public async Task<string> EnviarArquivo(string pedidoLinkId, byte[] arquivo, string? contentType)
    {
        try
        {
            var bucket = ObterBucket();
            var key = MontarArquivoKey(pedidoLinkId);
            var contentTypeArquivo = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType;

            using var s3Client = CriarS3Client();
            using var stream = new MemoryStream(arquivo);

            await s3Client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = bucket,
                Key = key,
                InputStream = stream,
                ContentType = contentTypeArquivo
            });

            return MontarBucketUrl(bucket, ObterRegiaoObrigatoria(), key);
        }
        catch
        {
            throw;
        }
    }

    public async Task<(byte[] Arquivo, string ContentType, string NomeArquivo)> ObterArquivo(string pedidoLinkId)
    {
        try
        {
            var bucket = ObterBucket();
            var key = ObterArquivoKey(pedidoLinkId, bucket);

            using var s3Client = CriarS3Client();
            using var response = await s3Client.GetObjectAsync(bucket, key);
            using var stream = new MemoryStream();

            await response.ResponseStream.CopyToAsync(stream);

            return (
                stream.ToArray(),
                response.Headers.ContentType ?? "application/octet-stream",
                ObterNomeArquivo(key));
        }
        catch
        {
            throw;
        }
    }

    private static AmazonS3Client CriarS3Client()
    {
        var accessKey = ObterVariavelObrigatoria("AWS_ACCESS_KEY_ID", "A variável de ambiente AWS_ACCESS_KEY_ID não foi encontrada ou configurada.");
        var secretKey = ObterVariavelObrigatoria("AWS_SECRET_ACCESS_KEY", "A variável de ambiente AWS_SECRET_ACCESS_KEY não foi encontrada ou configurada.");
        var credentials = new BasicAWSCredentials(accessKey, secretKey);

        return new AmazonS3Client(credentials, RegionEndpoint.GetBySystemName(ObterRegiaoObrigatoria()));
    }

    private static string ObterBucket()
    {
        return ObterVariavelObrigatoria("PedidoStorageBucket", "A variável de ambiente PedidoStorageBucket não foi encontrada ou configurada.");
    }

    private static string ObterArquivoKey(string pedidoLinkId, string bucket)
    {
        if (Uri.TryCreate(pedidoLinkId, UriKind.Absolute, out var uri))
            return ObterArquivoKeyUrl(uri, bucket);

        return MontarArquivoKey(pedidoLinkId);
    }

    private static string ObterArquivoKeyUrl(Uri uri, string bucket)
    {
        var path = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));

        if (string.IsNullOrWhiteSpace(path))
            return string.Empty;

        var bucketPrefix = $"{bucket}/";
        if (path.StartsWith(bucketPrefix, StringComparison.OrdinalIgnoreCase))
            path = path[bucketPrefix.Length..];

        return MontarArquivoKey(path);
    }

    private static string MontarArquivoKey(string pedidoLinkId)
    {
        var arquivo = pedidoLinkId.Trim().TrimStart('/');

        return arquivo.StartsWith("pedidos/", StringComparison.OrdinalIgnoreCase)
            ? arquivo
            : $"pedidos/{arquivo}";
    }

    private static string ObterNomeArquivo(string pedidoLinkId)
    {
        if (Uri.TryCreate(pedidoLinkId, UriKind.Absolute, out var uri))
            return Path.GetFileName(uri.AbsolutePath);

        return Path.GetFileName(pedidoLinkId);
    }

    private static string MontarBucketUrl(string bucket, string regionName, string key)
    {
        var escapedKey = string.Join("/", key.Split('/').Select(Uri.EscapeDataString));

        return regionName == "us-east-1"
            ? $"https://{bucket}.s3.amazonaws.com/{escapedKey}"
            : $"https://{bucket}.s3.{regionName}.amazonaws.com/{escapedKey}";
    }

    private static string ObterRegiaoObrigatoria()
    {
        var regionName = (Environment.GetEnvironmentVariable("AWS_REGION") ?? Environment.GetEnvironmentVariable("AWS_DEFAULT_REGION"))?.Trim();

        if (string.IsNullOrWhiteSpace(regionName))
            throw new InvalidOperationException("A variável de ambiente AWS_REGION não foi encontrada ou configurada.");

        return regionName;
    }

    private static string ObterVariavelObrigatoria(string nome, string mensagemErro)
    {
        var valor = Environment.GetEnvironmentVariable(nome)?.Trim();

        if (string.IsNullOrWhiteSpace(valor))
            throw new InvalidOperationException(mensagemErro);

        return valor;
    }
}
