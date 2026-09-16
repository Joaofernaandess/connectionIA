using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pedido.Infra.Services;

public class PedidoSeparadorService : IPedidoSeparadorService
{
    private const string OpenAiUrl = "https://api.openai.com/v1/responses";

    private readonly IHttpClientFactory _httpClientFactory;

    public PedidoSeparadorService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<List<PedidoArquivoSeparado>> Separar(PedidoUploadRequest request, byte[] arquivo)
    {
        if (!EhPdf(request))
            return [CriarArquivoOriginal(request, arquivo)];

        var totalPaginas = ObterTotalPaginasSeguro(arquivo);

        if (totalPaginas <= 1)
            return [CriarArquivoOriginal(request, arquivo, Math.Max(totalPaginas, 1))];

        var grupos = await ObterGruposPorIA(request, arquivo, totalPaginas);

        if (grupos.Count <= 1)
            return [CriarArquivoOriginal(request, arquivo, totalPaginas)];

        return SepararPdf(request.NomeArquivo, arquivo, grupos);
    }

    private async Task<List<List<int>>> ObterGruposPorIA(PedidoUploadRequest request, byte[] arquivo, int totalPaginas)
    {
        try
        {
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim();

            if (string.IsNullOrWhiteSpace(apiKey))
                return [];

            var model = Environment.GetEnvironmentVariable("PEDIDO_SEPARADOR_MODEL")?.Trim();

            if (string.IsNullOrWhiteSpace(model))
                model = "gpt-4.1-mini";

            var body = new
            {
                model,
                instructions = MontarInstrucoes(totalPaginas),
                input = new[]
                {
                    new
                    {
                        role = "user",
                        content = new object[]
                        {
                            new
                            {
                                type = "input_text",
                                text = $"Arquivo: {request.NomeArquivo}. Total de paginas: {totalPaginas}. Retorne apenas JSON."
                            },
                            new
                            {
                                type = "input_file",
                                filename = request.NomeArquivo,
                                file_data = $"data:application/pdf;base64,{Convert.ToBase64String(arquivo)}"
                            }
                        }
                    }
                },
                text = new
                {
                    format = new
                    {
                        type = "json_object"
                    }
                },
                temperature = 0
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, OpenAiUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var client = _httpClientFactory.CreateClient();
            using var response = await client.SendAsync(httpRequest);

            if (!response.IsSuccessStatusCode)
                return [];

            var responseBody = await response.Content.ReadAsStringAsync();
            var texto = ExtrairTextoResposta(responseBody);

            if (string.IsNullOrWhiteSpace(texto))
                return [];

            var resultado = JsonSerializer.Deserialize<PedidoSeparacaoIAResponse>(
                texto,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return ValidarGrupos(resultado?.Pedidos, totalPaginas);
        }
        catch
        {
            return [];
        }
    }

    private static string MontarInstrucoes(int totalPaginas)
    {
        return $$"""
Você separa um PDF de pedidos em grupos de páginas.
O arquivo tem {{totalPaginas}} páginas.
Identifique se cada página é continuação do pedido anterior ou início de outro pedido.
Use número do pedido, cabeçalho, cliente, fornecedor, totais e indicação de página para decidir.
Não extraia dados do pedido, itens ou grades.
Retorne JSON no formato:
{"pedidos":[{"paginas":[1],"numeroPedido":"","motivo":""}]}
Regras:
- Toda página de 1 a {{totalPaginas}} deve aparecer uma única vez.
- Mantenha a ordem original das páginas.
- Se uma página continuar o mesmo pedido, coloque no mesmo grupo.
- Se uma página iniciar outro pedido, crie outro grupo.
- Se não houver certeza, mantenha as páginas juntas.
""";
    }

    private static List<List<int>> ValidarGrupos(List<PedidoSeparacaoIAItem>? pedidos, int totalPaginas)
    {
        if (pedidos == null || pedidos.Count == 0)
            return [];

        var grupos = new List<List<int>>();
        var paginasEncontradas = new HashSet<int>();

        foreach (var pedido in pedidos)
        {
            var paginas = pedido.Paginas
                .Where(pagina => pagina >= 1 && pagina <= totalPaginas)
                .Distinct()
                .Order()
                .ToList();

            if (paginas.Count == 0)
                return [];

            if (paginas.Any(pagina => !paginasEncontradas.Add(pagina)))
                return [];

            grupos.Add(paginas);
        }

        if (paginasEncontradas.Count != totalPaginas)
            return [];

        var paginasOrdenadas = grupos.SelectMany(grupo => grupo).ToList();

        if (!paginasOrdenadas.SequenceEqual(Enumerable.Range(1, totalPaginas)))
            return [];

        return grupos;
    }

    private static string ExtrairTextoResposta(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);

        if (document.RootElement.TryGetProperty("output_text", out var outputText) &&
            outputText.ValueKind == JsonValueKind.String)
            return outputText.GetString() ?? string.Empty;

        if (!document.RootElement.TryGetProperty("output", out var output) ||
            output.ValueKind != JsonValueKind.Array)
            return string.Empty;

        foreach (var outputItem in output.EnumerateArray())
        {
            if (!outputItem.TryGetProperty("content", out var content) ||
                content.ValueKind != JsonValueKind.Array)
                continue;

            foreach (var contentItem in content.EnumerateArray())
            {
                if (contentItem.TryGetProperty("text", out var text) &&
                    text.ValueKind == JsonValueKind.String)
                    return text.GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }

    private static List<PedidoArquivoSeparado> SepararPdf(string nomeArquivo, byte[] arquivo, List<List<int>> grupos)
    {
        using var inputStream = new MemoryStream(arquivo);
        using var inputDocument = PdfReader.Open(inputStream, PdfDocumentOpenMode.Import);
        var arquivos = new List<PedidoArquivoSeparado>();

        for (var grupoIndex = 0; grupoIndex < grupos.Count; grupoIndex++)
        {
            using var outputDocument = new PdfDocument();
            var grupo = grupos[grupoIndex];

            foreach (var pagina in grupo)
            {
                var paginaOrigem = inputDocument.Pages[pagina - 1];
                var paginaDestino = outputDocument.AddPage(paginaOrigem);
                paginaDestino.Rotate = paginaOrigem.Rotate;
            }

            using var outputStream = new MemoryStream();
            outputDocument.Save(outputStream, false);

            arquivos.Add(new PedidoArquivoSeparado
            {
                Arquivo = outputStream.ToArray(),
                NomeArquivo = MontarNomeArquivoSeparado(nomeArquivo, grupoIndex + 1),
                ContentType = "application/pdf",
                PaginaInicial = grupo.First(),
                PaginaFinal = grupo.Last()
            });
        }

        return arquivos;
    }

    private static int ObterTotalPaginas(byte[] arquivo)
    {
        using var stream = new MemoryStream(arquivo);
        using var document = PdfReader.Open(stream, PdfDocumentOpenMode.Import);

        return document.PageCount;
    }

    private static int ObterTotalPaginasSeguro(byte[] arquivo)
    {
        try
        {
            return ObterTotalPaginas(arquivo);
        }
        catch
        {
            return 0;
        }
    }

    private static PedidoArquivoSeparado CriarArquivoOriginal(PedidoUploadRequest request, byte[] arquivo, int totalPaginas = 1)
    {
        return new PedidoArquivoSeparado
        {
            Arquivo = arquivo,
            NomeArquivo = request.NomeArquivo,
            ContentType = request.ContentType,
            PaginaInicial = 1,
            PaginaFinal = totalPaginas
        };
    }

    private static bool EhPdf(PedidoUploadRequest request)
    {
        return request.ContentType.Contains("pdf", StringComparison.OrdinalIgnoreCase) ||
            Path.GetExtension(request.NomeArquivo).Equals(".pdf", StringComparison.OrdinalIgnoreCase);
    }

    private static string MontarNomeArquivoSeparado(string nomeArquivo, int indice)
    {
        var diretorio = Path.GetDirectoryName(nomeArquivo);
        var nomeSemExtensao = Path.GetFileNameWithoutExtension(nomeArquivo);
        var extensao = Path.GetExtension(nomeArquivo);
        var novoNome = $"{nomeSemExtensao}_pedido_{indice:D2}{extensao}";

        return string.IsNullOrWhiteSpace(diretorio) ? novoNome : Path.Combine(diretorio, novoNome);
    }

    private sealed class PedidoSeparacaoIAResponse
    {
        [JsonPropertyName("pedidos")]
        public List<PedidoSeparacaoIAItem> Pedidos { get; set; } = new();
    }

    private sealed class PedidoSeparacaoIAItem
    {
        [JsonPropertyName("paginas")]
        public List<int> Paginas { get; set; } = new();
    }
}
