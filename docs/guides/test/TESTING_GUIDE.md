# 🧪 Guia Completo de Testes do Kmiza27

Este guia centraliza todos os procedimentos de teste para o chatbot, desde testes funcionais de ponta-a-ponta no WhatsApp até testes técnicos via API para desenvolvedores.

---

## 1. Testes Funcionais (via WhatsApp)

Esta seção é para qualquer pessoa (desenvolvedores, QAs, gerentes de produto) que queira validar o comportamento do chatbot em um ambiente real, interagindo diretamente com ele no WhatsApp.

### 1.1. Pré-requisitos
Para que os testes funcionem, o ambiente de produção deve estar 100% operacional:
- **Backend**: Rodando e acessível.
- **Evolution API**: Instância `kmizabot` conectada.
- **Webhook**: Ativo e configurado no EasyPanel.

Você pode verificar o status dos componentes aqui:
- **Backend Health**: `https://kmizabot.h4xd66.easypanel.host/health`
- **Frontend**: `https://kmizafront.h4xd66.easypanel.host`
- **Evolution API**: `https://kmiza27-evolution.h4xd66.easypanel.host`

### 1.2. Roteiro de Testes Recomendado
Envie as seguintes mensagens para o número do chatbot no WhatsApp para testar as principais funcionalidades. O bot deve responder rapidamente (1-3 segundos).

#### Testes Essenciais
- **Saudação**: `Oi`
  - *Esperado*: Menu completo de boas-vindas.
- **Pergunta com Acentos**: `Próximo jogo do Flamengo?`
  - *Esperado*: Informações específicas do próximo jogo do time.
- **Tabela de Classificação**: `Classificação do Brasileirão`
  - *Esperado*: Tabela de classificação atualizada do campeonato.
- **Pergunta com Emojis**: `⚽ Jogos hoje`
  - *Esperado*: Lista das partidas do dia.

#### Outros Testes
- **Posição de Time**: `Posição do São Paulo`
- **Próximo Jogo**: `Quando joga o Corinthians?`

### 1.3. Sinais de Sucesso
- O bot responde rapidamente.
- As respostas são específicas para cada pergunta.
- Acentos, cedilhas e emojis são processados corretamente.
- Os dados (jogos, tabelas) estão atualizados.

### 1.4. Troubleshooting Básico
- **Bot não responde**: Verifique os URLs de status acima. Se algum estiver fora, o sistema pode estar com problemas. Verifique os logs do serviço `kmizabot` no EasyPanel.

---

## 2. Testes de API (para Desenvolvedores)

Esta seção detalha como usar os endpoints de teste da API para simular mensagens e verificar a saúde dos serviços sem precisar da interface do WhatsApp. É ideal para desenvolvimento e debug de baixo nível.

### 2.1. Endpoints de Teste

#### Teste de Mensagem Única
- **Endpoint**: `POST /chatbot/test/message`
- **Uso**: Simula o recebimento de uma única mensagem.
- **Body**:
  ```json
  {
    "message": "tabela do brasileirão",
    "phoneNumber": "5511999999999"
  }
  ```

#### Teste Rápido via Query
- **Endpoint**: `GET /chatbot/test/quick?message=próximo jogo do flamengo`
- **Uso**: Forma rápida de testar uma mensagem via URL.

#### Health Check do Serviço
- **Endpoint**: `GET /chatbot/test/health`
- **Uso**: Verifica a saúde dos serviços integrados (Database, OpenAI, Evolution API).
- **Resposta Esperada**:
  ```json
  {
    "healthy": true,
    "checks": { "database": true, "openai": true, "evolution": true },
    "status": "Todos os serviços funcionando"
  }
  ```

### 2.2. Como Usar

#### Via cURL
```bash
# Teste de mensagem única
curl -X POST http://localhost:3000/chatbot/test/message -H "Content-Type: application/json" -d '{"message": "tabela do brasileirão"}'

# Health Check
curl http://localhost:3000/chatbot/test/health
```

#### Durante o Desenvolvimento
1.  **Inicie o servidor**: `cd backend && npm run start:dev`
2.  **Verifique a saúde**: `curl http://localhost:3000/chatbot/test/health`
3.  **Envie mensagens de teste** usando os endpoints acima.

### 2.3. Logs e Debug
Todos os testes de API geram logs detalhados no console do backend, mostrando a intenção detectada, o processamento e a resposta gerada, o que facilita o debug.

### 2.4. Troubleshooting de API
- **Erro de Conexão com Banco**: O health check retornará `"database": false`. Verifique se o contêiner do PostgreSQL está rodando e se as credenciais no `.env` estão corretas.
- **Erro no OpenAI**: O health check retornará `"openai": false`. Verifique a variável de ambiente `OPENAI_API_KEY`. 