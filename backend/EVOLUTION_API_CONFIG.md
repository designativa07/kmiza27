# Configuração da Evolution API

## Pré-requisitos

1. **Evolution API instalada e rodando**
2. **Instância do WhatsApp configurada**
3. **API Key da Evolution API**

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` com as seguintes variáveis:

```env
# Evolution API Configuration
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-api-key-aqui
EVOLUTION_INSTANCE_NAME=kmiza27-bot
WHATSAPP_ENABLED=true
```

### 2. Configuração da Evolution API

#### URL da API
- **Padrão**: `http://localhost:8080`
- **Personalizada**: Substitua pela URL da sua Evolution API

#### API Key
- Obtenha a API Key no painel da Evolution API
- Substitua `sua-api-key-aqui` pela sua chave real

#### Nome da Instância
- Use o nome da instância configurada na Evolution API
- Exemplo: `kmiza27-bot`, `meu-bot`, etc.

### 3. Testando a Configuração

#### Verificar Status da Instância
```bash
curl -H "apikey: SUA_API_KEY" http://localhost:8080/instance/fetchInstances
```

#### Enviar Mensagem de Teste
```bash
curl -X POST http://localhost:8080/message/sendText/NOME_DA_INSTANCIA \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY" \
  -d '{
    "number": "5548999999999@s.whatsapp.net",
    "text": "Teste de mensagem"
  }'
```

## Como Funciona

### 1. Sistema de Notificações

O sistema agora está integrado com a Evolution API:

- **Criar Notificação**: `POST /notifications`
- **Enviar via WhatsApp**: `POST /notifications/:id/send`
- **Verificar Status**: `GET /notifications/stats`

### 2. Fluxo de Envio

1. **Criar notificação** no painel admin
2. **Clicar em "Enviar"** na interface
3. **Sistema busca usuários** com telefone cadastrado
4. **Envia mensagens** via Evolution API
5. **Atualiza status** da notificação

### 3. Formato das Mensagens

```
*Título da Notificação*

Conteúdo da mensagem aqui...
```

## Modo de Simulação

Se `WHATSAPP_ENABLED=false`, o sistema:
- ✅ Simula o envio
- ✅ Marca como enviada
- ✅ Registra logs
- ❌ Não envia mensagens reais

## Logs e Monitoramento

O sistema registra:
- ✅ Tentativas de envio
- ✅ Sucessos e falhas
- ✅ Número de usuários alcançados
- ✅ Erros da Evolution API

## Solução de Problemas

### Erro: "WhatsApp está desabilitado"
- Verifique `WHATSAPP_ENABLED=true` no `.env`

### Erro: "Instância não encontrada"
- Verifique o `EVOLUTION_INSTANCE_NAME`
- Confirme se a instância está ativa na Evolution API

### Erro: "HTTP 401/403"
- Verifique a `EVOLUTION_API_KEY`
- Confirme se a chave tem permissões adequadas

### Erro: "Conexão recusada"
- Verifique se a Evolution API está rodando
- Confirme a `EVOLUTION_API_URL`

## Exemplo Completo

```env
# Arquivo .env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976
EVOLUTION_INSTANCE_NAME=kmiza27-bot
WHATSAPP_ENABLED=true
```

Com essa configuração, o sistema enviará mensagens reais via WhatsApp para todos os usuários cadastrados com telefone válido. 