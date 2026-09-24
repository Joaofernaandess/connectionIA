using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Pedido.Domain.Interfaces;

namespace Pedido.Infra.Services;

public class DesenhoFileStorageService : IDesenhoFileStorageService
{
    private const int UrlVisualizacaoMinutos = 15;

    public async Task EnviarArquivo(string key, byte[] arquivo, string? contentType)
    {
        try
        {
            var bucket = ObterBucket();
            var arquivoKey = MontarArquivoKey(key);
            var contentTypeArquivo = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType;

            using var s3Client = CriarS3Client();
            using var stream = new MemoryStream(arquivo);

            await s3Client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = bucket,
                Key = arquivoKey,
                InputStream = stream,
                ContentType = contentTypeArquivo
            });
        }
        catch
        {
            throw;
        }
    }

    public string GerarUrlVisualizacao(string key)
    {
        try
        {
            using var s3Client = CriarS3Client();

            return s3Client.GetPreSignedURL(new GetPreSignedUrlRequest
            {
                BucketName = ObterBucket(),
                Key = MontarArquivoKey(key),
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddMinutes(UrlVisualizacaoMinutos)
            });
        }
        catch
        {
            throw;
        }
    }

    public async Task<(string ArquivoBase64, string ContentType)> ObterArquivoBase64(string key)
    {
        try
        {
            using var s3Client = CriarS3Client();
            using var response = await s3Client.GetObjectAsync(ObterBucket(), MontarArquivoKey(key));
            using var memoryStream = new MemoryStream();

            await response.ResponseStream.CopyToAsync(memoryStream);

            return (Convert.ToBase64String(memoryStream.ToArray()), response.Headers.ContentType);
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

    private static string MontarArquivoKey(string linkId)
    {
        var arquivo = linkId.Trim().TrimStart('/');

        return arquivo.StartsWith("desenhos/", StringComparison.OrdinalIgnoreCase)
            ? arquivo
            : $"desenhos/{arquivo}";
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