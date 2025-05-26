# 🚀 Configuração de Deploy - kmiza27-chatbot

## 📋 Informações do Projeto

- **Repositório**: https://github.com/designativa07/kmiza27
- **Projeto**: kmiza27-chatbot
- **Tecnologia**: NestJS + Next.js
- **Hospedagem**: Hostinger VPS + Easypanel

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI
OPENAI_API_KEY="sk-proj-your-key-here"

# Evolution API
EVOLUTION_API_URL="https://kmiza27-evolution.h4xd66.easypanel.host"
EVOLUTION_API_KEY="95DC243F41B2-4858-B0F1-FF49D8C46A85"
EVOLUTION_INSTANCE="kmizabot"

# Application
NODE_ENV="production"
PORT=3000
PRODUCTION_URL="https://sua-url-producao.com"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://sua-url-backend.com"
```

## 🌐 URLs de Produção

### Webhook Configuration
- **Evolution API**: `https://kmiza27-evolution.h4xd66.easypanel.host`
- **Instância**: `kmizabot`
- **API Key**: `95DC243F41B2-4858-B0F1-FF49D8C46A85`
- **Webhook URL**: `https://sua-url-backend.com/chatbot/webhook`

## 📦 Scripts de Deploy

### 1. Configurar Webhook para Produção
```bash
# Definir variáveis
export NODE_ENV=production
export PRODUCTION_URL=https://sua-url-producao.com

# Executar configuração
node configure-webhook-auto.js
```

### 2. Build do Projeto
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🔄 Comandos Úteis

### Desenvolvimento
```bash
# Configurar webhook para ngrok
node configure-webhook-ngrok.js

# Testar webhook
node test-webhook-palmeiras.js
```

### Produção
```bash
# Configurar webhook para produção
node configure-webhook-production.js

# Configuração automática
node configure-webhook-auto.js
```

## 📊 Monitoramento

### Health Checks
- **Backend**: `GET /chatbot/status`
- **WhatsApp**: `GET /whatsapp/status`

### Logs
- Verificar logs via Easypanel
- Monitorar webhook responses
- Acompanhar métricas de uso

## 🔒 Segurança

### Checklist
- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS habilitado
- [ ] Webhook validado
- [ ] Rate limiting ativo
- [ ] Logs estruturados

## 📞 Suporte

- **GitHub Issues**: https://github.com/designativa07/kmiza27/issues
- **Documentação**: README.md
- **Webhook Test**: Use os scripts de teste inclusos 