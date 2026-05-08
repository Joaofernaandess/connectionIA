# Notificação em Massa - Rota `/notificacaoMassa`

## Descrição

Endpoint para enviar notificações em massa via WhatsApp para múltiplos contatos através da plataforma **Take.Blip**. Integrada com o **SommusGestor** para campanhas do Blip Active Campaign Growth.

---

## Endpoint

```
POST https://blip.sommus.com/notificacaoMassa
```

### Headers Obrigatórios
```
Content-Type: application/json
Origin: https://sommusgestor.com
```

---

## Estrutura da Requisição

```json
{
  "request": {
    "nomeCampanha": "string",
    "agendamento": "YYYY-MM-DD HH:mm (opcional)",
    "contatos": [
      {
        "whatsapp": "string",
        "documentoUrl": "string",
        "parametros": [
          { "index": 1, "valor": "string" }
        ]
      }
    ]
  }
}
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `nomeCampanha` | String | ✅ | Nome da campanha |
| `agendamento` | String | ❌ | Data/hora Brasília (UTC-3). Formato: `"2026-03-25 14:30"` |
| `contatos` | Array | ✅ | Lista de contatos (mín. 1) |
| `contatos[].whatsapp` | String | ✅ | Número WhatsApp (aceita com/sem máscara) |
| `contatos[].documentoUrl` | String | ✅ | URL do documento (PDF) para enviar |
| `contatos[].parametros` | Array | ✅ | Parâmetros do template (`index` e `valor`) |

---

## Exemplos

### Um Contato Simples
```json
{
  "request": {
    "nomeCampanha": "Faturamento-1225-2026-03-01",
    "agendamento": "2026-03-01 08:00",
    "contatos": [
      {
        "whatsapp": "+5537999887766",
        "documentoUrl": "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12867/Pdf/032026_00012867_107811_51699057LIVIAKAROLINESOUSACORREA.pdf",
        "parametros": [
          { "index": "1", "valor": "17/03/2026" },
          { "index": "2", "valor": "R$ 225,00" },
          { "index": "3", "valor": "LIVIA KAROLINE SOUSA CORREA" }
        ]
      }
    ]
  }
}
```

### Três Contatos com Dados Diferentes
```json
{
  "request": {
    "nomeCampanha": "Faturamento-1225-2026-03-01",
    "agendamento": "2026-03-01 08:00",
    "contatos": [
      {
        "whatsapp": "+5537999887766",
        "documentoUrl": "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12867/Pdf/boleto1.pdf",
        "parametros": [
          { "index": 1, "valor": "17/03/2026" },
          { "index": 2, "valor": "R$ 225,00" },
          { "index": 3, "valor": "LIVIA KAROLINE SOUSA CORREA" }
        ]
      },
      {
        "whatsapp": "+5537999112233",
        "documentoUrl": "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12868/Pdf/boleto2.pdf",
        "parametros": [
          { "index": 1, "valor": "18/03/2026" },
          { "index": 2, "valor": "R$ 450,50" },
          { "index": 3, "valor": "JOAO DA SILVA PEREIRA" }
        ]
      },
      {
        "whatsapp": "+5537999665544",
        "documentoUrl": "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12869/Pdf/boleto3.pdf",
        "parametros": [
          { "index": 1, "valor": "20/03/2026" },
          { "index": 2, "valor": "R$ 1.200,00" },
          { "index": 3, "valor": "MARIA COSTA SANTOS" }
        ]
      }
    ]
  }
}
```

---

## Response

### Sucesso (HTTP 200)
```json
{
  "message": "Campanha enviada com sucesso",
  "data": {
    "campaignId": "campaign-uuid-aqui"
  }
}
```

### Erros

| Status | Erro | Solução |
|--------|------|---------|
| **403** | Origin não permitido | Verificar header `Origin: https://sommusgestor.com` |
| **400** | Request ausente | Incluir `{ "request": {...} }` no body |
| **400** | Contatos inválidos | Validar números WhatsApp (11 dígitos) |
| **400** | Sem contatos válidos | Todos os contatos foram filtrados (WhatsApp inválido) |
| **500** | Erro servidor | Contactar administrador |

---

## Validações

- ✅ **Origin**: Deve conter "sommusgestor.com"
- ✅ **WhatsApp**: Celular brasileiro válido (11 dígitos)
- ✅ **Contatos**: Array com mín. 1 contato válido
- ✅ **Agendamento**: Se informado, deve ser data/hora futura (UTC-3 Brasília)
- ✅ **Documentação**: URL do documento no S3

---

## Fluxo de Processamento

1. Valida header `Origin`
2. Valida body `request`
3. Itera contatos:
   - Remove máscara de WhatsApp
   - Valida se é celular brasileiro
   - Converte documentoUrl para URL pré-assinada S3
   - Monta messageParams (documento + parâmetros)
4. Filtra apenas contatos válidos
5. Se agendamento: converte UTC-3 → UTC
6. Envia campanha ao Blip
7. Retorna `campaignId`

---

## Agendamento

### Formato
```
"YYYY-MM-DD HH:mm"
```

### Exemplos
- `"2026-03-25 13:40"` → Enviado às 13:40 horário Brasília (16:40 UTC)
- `"2026-12-24 08:30"` → Enviado às 08:30 horário Brasília (11:30 UTC)

**Nota**: Horário sempre interpretado como **Brasília (UTC-3)**. Sistema converte automaticamente para UTC no Blip.

---

## Integração - Postman / cURL / JavaScript

### cURL
```bash
curl -X POST https://blip.sommus.com/notificacaoMassa \
  -H "Content-Type: application/json" \
  -H "Origin: https://sommusgestor.com" \
  -d '{
    "request": {
      "nomeCampanha": "Faturamento-1225-2026-03-01",
      "agendamento": "2026-03-01 08:00",
      "contatos": [
        {
          "whatsapp": "+5537999887766",
          "documentoUrl": "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12867/Pdf/032026_00012867_107811_51699057LIVIAKAROLINESOUSACORREA.pdf",
          "parametros": [
            { "index": 1, "valor": "17/03/2026" },
            { "index": 2, "valor": "R$ 225,00" },
            { "index": 3, "valor": "LIVIA KAROLINE SOUSA CORREA" }
          ]
        }
      ]
    }
  }'
```

### JavaScript
```javascript
async function enviarCampanha(nomeCampanha, agendamento, contatos) {
  const response = await fetch('https://blip.sommus.com/notificacaoMassa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://sommusgestor.com'
    },
    body: JSON.stringify({
      request: {
        nomeCampanha: nomeCampanha,
        agendamento: agendamento,
        contatos: contatos
      }
    })
  });

  const resultado = await response.json();

  if (resultado.data?.campaignId) {
    console.log('Campanha enviada:', resultado.data.campaignId);
  }

  return resultado;
}

// Exemplo de uso
const contatos = [
  {
    whatsapp: "+5537999887766",
    documentoUrl: "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12867/Pdf/boleto1.pdf",
    parametros: [
      { "index": 1, "valor": "17/03/2026" },
      { "index": 2, "valor": "R$ 225,00" },
      { "index": 3, "valor": "LIVIA KAROLINE SOUSA CORREA" }
    ]
  },
  {
    whatsapp: "+5537999112233",
    documentoUrl: "https://sommusgestor.s3.sa-east-1.amazonaws.com/Empresas/1/Financas/Boletos/12868/Pdf/boleto2.pdf",
    parametros: [
      { "index": 1, "valor": "18/03/2026" },
      { "index": 2, "valor": "R$ 450,50" },
      { "index": 3, "valor": "JOAO DA SILVA PEREIRA" }
    ]
  }
];

await enviarCampanha("Faturamento-1225-2026-03-01", "2026-03-01 08:00", contatos);
```

---

## Boas Práticas

✅ **Faça**
- Valide contatos antes de enviar
- Use nomes descritivos para campanhas
- Agende campanhas com 24h de antecedência
- Envie em horário comercial (08:00-19:00)
- Teste com 1-2 contatos primeiro

❌ **Não Faça**
- Não envie datas no passado
- Não envie demasiadas campanhas simultâneas
- Não esqueça header Origin
- Não use segundos no agendamento (usar `HH:mm`)

---

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Error 403 | Origin inválido | Certificar que Origin contém "sommusgestor.com" |
| 0 contatos válidos | WhatsApp inválido | Validar formato: 11 dígitos após limpeza |
| Campaign não agendada | Horário no passado | Usar data/hora futura em UTC-3 |
| Erro ao converter documento | URL inválida | Verificar se URL do S3 é acessível |

---

## Logs do Sistema

O servidor registra:
```
[enviaNotificacaoEmMassaWhatsapp] agendamento recebido: 2026-03-25 13:40
[enviaNotificacaoEmMassaWhatsapp] agendamento local: 2026-03-25 13:40 → UTC: 2026-03-25 16:40
```
