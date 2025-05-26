# Configuração de Variáveis de Ambiente

## Variáveis Necessárias

Para executar o projeto, você precisa definir as seguintes variáveis de ambiente:

### Banco de Dados
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=kmiza27_chatbot
```

### Evolution API (WhatsApp)
```bash
EVOLUTION_API_URL=https://kmiza27-evolution.h4xd66.easypanel.host
EVOLUTION_API_KEY=DEEFCBB25D74-4E46-BE91-CA7852798094
EVOLUTION_INSTANCE_NAME=Kmiza27
WHATSAPP_ENABLED=true
```

### Servidor
```bash
PORT=3000
NODE_ENV=development
```

## Como Executar

### PowerShell (Windows)
```powershell
$env:EVOLUTION_API_URL="https://kmiza27-evolution.h4xd66.easypanel.host"
$env:EVOLUTION_API_KEY="DEEFCBB25D74-4E46-BE91-CA7852798094"
$env:EVOLUTION_INSTANCE_NAME="Kmiza27"
$env:WHATSAPP_ENABLED="true"
$env:DATABASE_HOST="localhost"
$env:DATABASE_PORT="5432"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="postgres"
$env:DATABASE_NAME="kmiza27_chatbot"
npm run start:dev
```

### Bash (Linux/Mac)
```bash
export EVOLUTION_API_URL="https://kmiza27-evolution.h4xd66.easypanel.host"
export EVOLUTION_API_KEY="DEEFCBB25D74-4E46-BE91-CA7852798094"
export EVOLUTION_INSTANCE_NAME="Kmiza27"
export WHATSAPP_ENABLED="true"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="postgres"
export DATABASE_NAME="kmiza27_chatbot"
npm run start:dev
```

## Status do Sistema

✅ **WhatsApp Integration**: Funcionando perfeitamente
✅ **Database**: Conectado e operacional
✅ **Notifications**: Sistema de notificações ativo
✅ **Evolution API**: Conectada e enviando mensagens

## Teste de Funcionamento

Para testar se o WhatsApp está funcionando:

```bash
# Teste de conexão
curl -X POST http://localhost:3000/notifications/test-whatsapp

# Teste de envio direto
curl -X POST http://localhost:3000/notifications/test-direct-send
``` 