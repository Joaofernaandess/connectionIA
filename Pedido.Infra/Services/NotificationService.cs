using Pedido.Domain.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Pedido.Infra.Services;

public class NotificationService : IAuthNotificationService, IPedidoNotificationService
{
    private readonly HttpClient _httpClient;

    public NotificationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task EnviarSolicitacaoRevisaoPedidoAsync(string telefone, string numeroPedido)
    {
        await EnviarTemplateAsync(
            telefone,
            ObterVariavelObrigatoria("TWILIO_PEDIDO_REVISAO_CONTENT_SID"),
            new TemplateVariables(numeroPedido, numeroPedido),
            "Erro ao enviar notificação de revisão do pedido");
    }

    public async Task EnviarCodigoAcessoAsync(string telefone, string codigo)
    {
        await EnviarTemplateAsync(
            telefone,
            ObterVariavelObrigatoria("TWILIO_WHATSAPP_CONTENT_SID"),
            new TemplateVariables(codigo),
            "Erro ao enviar código pelo WhatsApp");
    }

    private async Task EnviarTemplateAsync(
        string telefone,
        string contentSid,
        TemplateVariables contentVariables,
        string mensagemErro)
    {
        var accountSid = ObterVariavelObrigatoria("TWILIO_ACCOUNT_SID");
        var authToken = ObterVariavelObrigatoria("TWILIO_AUTH_TOKEN");
        var messagingServiceSid = Environment.GetEnvironmentVariable("TWILIO_MESSAGING_SERVICE_SID");
        var fromNumber = Environment.GetEnvironmentVariable("TWILIO_WHATSAPP_FROM_NUMBER");

        if (string.IsNullOrWhiteSpace(messagingServiceSid) && string.IsNullOrWhiteSpace(fromNumber))
            throw new InvalidOperationException("Configure TWILIO_MESSAGING_SERVICE_SID ou TWILIO_WHATSAPP_FROM_NUMBER.");

        var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);

        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", GerarBasicAuth(accountSid, authToken));

        var parametros = new Dictionary<string, string>
        {
            ["To"] = NormalizarTelefoneWhatsApp(telefone),
            ["ContentSid"] = contentSid,
            ["ContentVariables"] = JsonSerializer.Serialize(contentVariables.ToTwilioParameters())
        };

        if (!string.IsNullOrWhiteSpace(messagingServiceSid))
            parametros["MessagingServiceSid"] = messagingServiceSid;
        else
            parametros["From"] = NormalizarTelefoneWhatsApp(fromNumber!);

        request.Content = new FormUrlEncodedContent(parametros);

        using var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
            return;

        var responseBody = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException($"{mensagemErro}: {responseBody}");
    }

    private static string GerarBasicAuth(string accountSid, string authToken)
    {
        var rawToken = $"{accountSid}:{authToken}";
        return Convert.ToBase64String(Encoding.ASCII.GetBytes(rawToken));
    }

    private static string ObterVariavelObrigatoria(string nome)
    {
        var valor = Environment.GetEnvironmentVariable(nome);

        if (string.IsNullOrWhiteSpace(valor))
            throw new InvalidOperationException($"A variável de ambiente {nome} não foi encontrada ou configurada.");

        return valor;
    }

    private static string NormalizarTelefoneWhatsApp(string telefone)
    {
        var digits = new string(telefone.Where(char.IsDigit).ToArray());

        if (string.IsNullOrWhiteSpace(digits))
            throw new InvalidOperationException("Telefone não informado.");

        if (digits.StartsWith("55"))
            return $"whatsapp:+{digits}";

        return $"whatsapp:+55{digits}";
    }
}

public sealed class TemplateVariables
{
    private readonly IReadOnlyList<string> _values;

    public TemplateVariables(params string[] values)
    {
        _values = values;
    }

    public Dictionary<string, string> ToTwilioParameters()
    {
        return _values
            .Select((value, index) => new KeyValuePair<string, string>((index + 1).ToString(), value))
            .ToDictionary(item => item.Key, item => item.Value);
    }
}
