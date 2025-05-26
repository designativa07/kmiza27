# 🤖 kmiza27-chatbot

Chatbot inteligente para WhatsApp com IA integrada, especializado em informações de futebol brasileiro.

## 📋 Sobre o Projeto

O **kmiza27-chatbot** é um sistema completo de chatbot para WhatsApp que utiliza inteligência artificial para responder automaticamente a perguntas sobre futebol brasileiro. O sistema é composto por um backend em NestJS, frontend em Next.js e integração com a Evolution API para WhatsApp.

### 🎯 Funcionalidades

- 🤖 **Chatbot com IA**: Respostas inteligentes usando OpenAI
- ⚽ **Especializado em Futebol**: Informações sobre times, jogos e competições
- 📱 **WhatsApp Integration**: Integração completa com WhatsApp via Evolution API
- 🎨 **Interface Web**: Dashboard para gerenciar conversas e configurações
- 📊 **Analytics**: Estatísticas de uso e engajamento
- 🔔 **Notificações**: Sistema de notificações automáticas para jogos

### 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │◄──►│  Evolution API   │◄──►│   Backend       │
│   (Usuários)    │    │  (Webhook)       │    │   (NestJS)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Database       │◄──►│   OpenAI API    │
│   (Next.js)     │    │   (PostgreSQL)   │    │   (IA)          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados
- **TypeORM** - ORM para banco de dados
- **OpenAI API** - Inteligência artificial

### Frontend
- **Next.js 15** - Framework React
- **TypeScript** - Linguagem de programação
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes UI

### Infraestrutura
- **Evolution API** - Integração WhatsApp
- **Hostinger VPS** - Hospedagem
- **Easypanel** - Gerenciamento de containers
- **ngrok** - Túnel para desenvolvimento

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- Conta OpenAI (para IA)
- Evolution API configurada

### 1. Clone o repositório

```bash
git clone https://github.com/designativa07/kmiza27.git
cd kmiza27
```

### 2. Configuração do Backend

```bash
cd backend
npm install

# Copie e configure as variáveis de ambiente
cp .env.example .env
```

Configure o arquivo `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kmiza27"

# OpenAI
OPENAI_API_KEY="sua_chave_openai"

# Evolution API
EVOLUTION_API_URL="https://sua-evolution-api.com"
EVOLUTION_API_KEY="sua_chave_evolution"
EVOLUTION_INSTANCE="sua_instancia"

# Ambiente
NODE_ENV="development"
PORT=3000
```

### 3. Configuração do Frontend

```bash
cd frontend
npm install

# Copie e configure as variáveis de ambiente
cp .env.example .env.local
```

Configure o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Executar o projeto

```bash
# Backend (terminal 1)
cd backend
npm run start:dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

## 🔧 Configuração do Webhook

### Desenvolvimento (com ngrok)

1. Instale e configure o ngrok
2. Execute: `ngrok http 3000`
3. Configure o webhook:

```bash
node configure-webhook-ngrok.js
```

### Produção (VPS)

```bash
# Defina a URL de produção
export NODE_ENV=production
export PRODUCTION_URL=https://sua-url-producao.com

# Configure o webhook
node configure-webhook-auto.js
```

## 🤖 Como Usar

### Comandos do Chatbot

O chatbot responde a perguntas em linguagem natural sobre:

- **Próximos jogos**: "Próximo jogo do Flamengo"
- **Informações de times**: "Informações do Palmeiras"
- **Tabela de classificação**: "Tabela do Brasileirão"
- **Jogos de hoje**: "Jogos de hoje"

### Exemplos de Uso

```
Usuário: "Flamengo"
Bot: ⚽ PRÓXIMO JOGO DO FLAMENGO ⚽
     📅 Data: 26/05/2025
     ⏰ Horário: 20:00
     🏆 Competição: Brasileirão Série A
     🆚 Adversário: Palmeiras
     🏟️ Estádio: Maracanã
```

## 📊 API Endpoints

### Chatbot
- `POST /chatbot/webhook` - Webhook para receber mensagens
- `GET /chatbot/status` - Status do chatbot
- `POST /chatbot/test-message` - Testar mensagem

### WhatsApp
- `GET /whatsapp/conversations` - Listar conversas
- `POST /whatsapp/send` - Enviar mensagem
- `GET /whatsapp/status` - Status da conexão

### Teams & Matches
- `GET /teams` - Listar times
- `GET /matches` - Listar partidas
- `GET /competitions` - Listar competições

## 🚀 Deploy

### Usando Easypanel (Recomendado)

Para deploy completo em produção, siga o guia detalhado: **[`EASYPANEL-DEPLOY.md`](./EASYPANEL-DEPLOY.md)**

**Resumo do processo:**

1. **Instalar Easypanel na VPS**:
```bash
curl -sSL https://get.docker.com | sh
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

2. **Criar projeto e serviços**:
   - PostgreSQL database
   - Redis cache
   - Backend app (NestJS)
   - Frontend app (Next.js)

3. **Deploy via GitHub**:
   - Conecte o repositório
   - Configure Dockerfile
   - Deploy automático

4. **Configure webhook**:
```bash
node configure-webhook-easypanel.js
```

**Vantagens do Easypanel:**
- ✅ Interface visual intuitiva
- ✅ SSL automático (Let's Encrypt)
- ✅ Deploy automático via Git
- ✅ Zero downtime deployments
- ✅ Backup automático
- ✅ Monitoramento integrado

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
DATABASE_URL=sua_url_postgresql_producao
OPENAI_API_KEY=sua_chave_openai
EVOLUTION_API_URL=https://kmiza27-evolution.h4xd66.easypanel.host
EVOLUTION_API_KEY=95DC243F41B2-4858-B0F1-FF49D8C46A85
PRODUCTION_URL=https://sua-url-producao.com
```

## 🔒 Segurança

- ✅ Validação de webhooks
- ✅ Sanitização de inputs
- ✅ Rate limiting
- ✅ Variáveis de ambiente para dados sensíveis
- ✅ HTTPS obrigatório em produção

## 📈 Monitoramento

- **Logs estruturados** com Winston
- **Health checks** automáticos
- **Métricas de performance**
- **Alertas de erro**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/designativa07/kmiza27/issues)
- **Documentação**: [Wiki do projeto](https://github.com/designativa07/kmiza27/wiki)

## 🏆 Status do Projeto

- ✅ Backend funcional
- ✅ Frontend responsivo
- ✅ Integração WhatsApp
- ✅ IA integrada
- ✅ Deploy em produção
- 🔄 Melhorias contínuas

---

**Desenvolvido com ❤️ para a comunidade de futebol brasileiro** ⚽ 