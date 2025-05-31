# 🧪 Guia de Testes do Chatbot Kmiza27

Este documento explica como usar as funções de teste implementadas para o chatbot em desenvolvimento.

## 📋 Endpoints Disponíveis

### 1. Teste de Mensagem Única
**POST** `/chatbot/test/message`

Testa uma única mensagem no chatbot.

```json
{
  "message": "tabela do brasileirão",
  "phoneNumber": "5511999999999" // opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "input": {
    "message": "tabela do brasileirão",
    "phoneNumber": "5511999999999",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "output": {
    "response": "📊 **TABELA - BRASILEIRÃO** 📊\n\n🥇 Flamengo - 45 pts...",
    "processingTime": "234ms"
  },
  "debug": {
    "messageLength": 19,
    "responseLength": 456,
    "environment": "development"
  }
}
```

### 2. Teste Rápido via Query
**GET** `/chatbot/test/quick?message=próximo jogo do flamengo`

Forma rápida de testar uma mensagem via URL.

### 3. Teste de Múltiplas Mensagens
**POST** `/chatbot/test/multiple`

Testa várias mensagens em sequência.

```json
{
  "messages": [
    "oi",
    "tabela do brasileirão", 
    "próximo jogo do flamengo"
  ],
  "phoneNumber": "5511999999999" // opcional
}
```

### 4. Teste de Cenários Automáticos
**GET** `/chatbot/test/scenarios`

Executa testes automáticos para vários cenários pré-definidos:
- Saudações
- Próximos jogos
- Tabelas
- Jogos hoje
- Informações de times
- Últimos jogos

### 5. Health Check
**GET** `/chatbot/test/health`

Verifica a saúde de todos os serviços:

```json
{
  "healthy": true,
  "checks": {
    "database": true,
    "openai": true,
    "evolution": true,
    "repositories": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "Todos os serviços funcionando"
}
```

## 🚀 Como Usar

### 1. Via cURL

```bash
# Teste simples
curl -X POST http://localhost:3000/chatbot/test/message \
  -H "Content-Type: application/json" \
  -d '{"message": "tabela do brasileirão"}'

# Teste rápido
curl "http://localhost:3000/chatbot/test/quick?message=próximo jogo do flamengo"

# Health check
curl http://localhost:3000/chatbot/test/health

# Cenários automáticos
curl http://localhost:3000/chatbot/test/scenarios
```

### 2. Via Postman/Insomnia

1. Importe a collection com os endpoints acima
2. Configure a base URL: `http://localhost:3000`
3. Execute os testes

### 3. Via Frontend (React/Vue/Angular)

```javascript
// Teste de mensagem única
const testMessage = async (message) => {
  const response = await fetch('/chatbot/test/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return response.json();
};

// Health check
const checkHealth = async () => {
  const response = await fetch('/chatbot/test/health');
  return response.json();
};
```

## 📊 Exemplos de Mensagens para Teste

### Saudações
- "oi"
- "olá"
- "bom dia"

### Próximos Jogos
- "próximo jogo do flamengo"
- "quando joga o palmeiras"
- "próximo jogo corinthians"

### Tabelas
- "tabela do brasileirão"
- "classificação brasileirao"
- "tabela brasileiro"

### Jogos
- "jogos hoje"
- "jogos de hoje"
- "jogos da semana"

### Informações de Times
- "informações do santos"
- "info do botafogo"
- "dados do são paulo"

### Últimos Jogos
- "último jogo do flamengo"
- "resultado palmeiras"
- "como foi o jogo do corinthians"

## 🔧 Configuração para Desenvolvimento

1. **Inicie o servidor:**
```bash
cd backend
npm run start:dev
```

2. **Teste a API:**
```bash
curl http://localhost:3000/chatbot/test/health
```

3. **Execute cenários automáticos:**
```bash
curl http://localhost:3000/chatbot/test/scenarios
```

## 📝 Logs e Debug

Todos os testes geram logs detalhados no console:

```
🧪 TESTE - Processando mensagem: "tabela do brasileirão"
🧠 Intenção detectada: table (95%)
📊 Buscando tabela da competição: brasileirao
🤖 Resposta gerada para 5511999999999
```

## ⚠️ Notas Importantes

1. **Ambiente de Desenvolvimento:** Essas funções são apenas para desenvolvimento
2. **Performance:** Os testes incluem métricas de tempo de processamento
3. **Banco de Dados:** Certifique-se que o PostgreSQL está rodando
4. **OpenAI:** Verifique se a API key está configurada
5. **Evolution API:** Para testes completos, configure a Evolution API

## 🐛 Troubleshooting

### Erro de Conexão com Banco
```json
{
  "healthy": false,
  "checks": {
    "database": false
  }
}
```
**Solução:** Verifique se o PostgreSQL está rodando e as credenciais estão corretas.

### Erro no OpenAI
```json
{
  "checks": {
    "openai": false
  }
}
```
**Solução:** Verifique a variável `OPENAI_API_KEY` no `.env`.

### Timeout nos Testes
**Solução:** Aumente o timeout ou verifique a conexão de rede.

---

🤖 **Kmiza27 Bot** - Sistema de testes para desenvolvimento 