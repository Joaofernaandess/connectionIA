# Pedido Certo AI API

Backend .NET do Pedido Certo AI.

## Estrutura

```text
pedido-certo-ai-api
  Pedido.Server
  pedido-certo-ai.sln
```

## Variaveis Obrigatorias

Configure antes de rodar o backend:

```powershell
DefaultConnection="Host=localhost;Port=5432;Database=pedido_certo_ai;Username=postgres;Password=admin"
zenite_jwt_auth="sua_chave_jwt"

AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="sua_access_key"
AWS_SECRET_ACCESS_KEY="sua_secret_key"
PedidoStorageBucket="pedido-certo-ai"

PEDIDO_ANALISE_IA_WEBHOOK_TOKEN="mesmo_token_configurado_na_lambda"
```

## Para Que Serve Cada Variavel

```text
DefaultConnection
String de conexao PostgreSQL.

zenite_jwt_auth
Chave usada para gerar/validar JWT.

AWS_REGION
Regiao AWS do bucket S3. Atualmente: us-east-2.

AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
Credenciais usadas pelo backend para enviar arquivos ao S3.

PedidoStorageBucket
Bucket onde os arquivos de pedido sao salvos.

PEDIDO_ANALISE_IA_WEBHOOK_TOKEN
Token validado no endpoint PUT /v1/pedidos/{pedidoId}/analise-ia.
A Lambda envia esse token no header X-Pedido-Webhook-Token.
```

## Fluxo De Pedido

```text
Front-end
  -> POST /v1/pedidos/upload
  -> Backend salva arquivo no S3
  -> Backend cria pedido no banco com status AguardandoAnaliseIA
  -> S3 Event Notification envia evento para SQS
  -> SQS aciona Lambda zenite-agents
  -> Lambda analisa com OpenAI
  -> Lambda chama PUT /v1/pedidos/{pedidoId}/analise-ia
  -> Backend atualiza pedido, itens e grades
```

O backend nao envia mensagem diretamente para SQS. Quem dispara a fila e o evento do bucket S3.

## Rodar

```powershell
cd C:\Users\dougl\source\Repositórios\pedido-certo-ai-api\Pedido.Server
dotnet run
```

## Build

```powershell
cd C:\Users\dougl\source\Repositórios\pedido-certo-ai-api
dotnet build -c Release
```

## Docker PostgreSQL Local

```powershell
docker run --name pg-pedido-certo-ai -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=pedido_certo_ai -p 5432:5432 -d postgres:latest
```

O SQL base esta em:

```text
Pedido.Server/Repositories/_database.sql
```

