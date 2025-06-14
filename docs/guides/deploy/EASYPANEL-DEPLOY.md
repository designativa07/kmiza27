# 🚀 Deploy kmiza27-chatbot no Easypanel

Guia completo para fazer deploy do chatbot WhatsApp com IA no Easypanel.

## 📋 Pré-requisitos

- ✅ VPS com Easypanel instalado
- ✅ Domínio configurado (opcional, mas recomendado)
- ✅ Chaves da OpenAI e Evolution API
- ✅ Repositório GitHub: `https://github.com/designativa07/kmiza27`

## 🏗️ Arquitetura no Easypanel

```
┌─────────────────────────────────────────────────────────────┐
│                    EASYPANEL VPS                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL    │  │      Redis      │  │   Backend    │ │
│  │   (Database)    │  │     (Cache)     │  │   (NestJS)   │ │
│  │   Port: 5432    │  │   Port: 6379    │  │  Port: 3000  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Frontend (Next.js)                      │ │
│  │                   Port: 3001                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Evolution API  │
                    │   (External)    │
                    └─────────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ WhatsApp │
                        └──────────┘
```

## 🔧 Passo 1: Configurar Easypanel

### 1.1 Acessar o Painel
```bash
# Acesse via navegador
https://seu-ip-vps
# ou
https://seu-dominio.com
```

### 1.2 Criar Projeto
1. Clique em **"Create Project"**
2. Nome: `kmiza27-chatbot`
3. Clique em **"Create"**

## 🗄️ Passo 2: Configurar Banco de Dados

### 2.1 Adicionar PostgreSQL
1. Clique em **"+ Service"** → **"Postgres"**
2. **Service Name**: `kmiza27-db`
3. **Database Name**: `kmiza27_chatbot`
4. **Username**: `kmiza27_user`
5. **Password**: `sua_senha_forte_aqui`
6. Clique em **"Create"**

### 2.2 Configurar Redis
1. Clique em **"+ Service"** → **"Redis"**
2. **Service Name**: `kmiza27-redis`
3. **Password**: `sua_senha_redis_aqui`
4. Clique em **"Create"**

## 🚀 Passo 3: Deploy do Backend

### 3.1 Criar App Backend
1. Clique em **"+ Service"** → **"App"**
2. **Service Name**: `kmiza27-backend`
3. Clique em **"Create"**

### 3.2 Configurar Source
Na aba **"Source"**:
- **Source Type**: `GitHub`
- **Repository**: `https://github.com/designativa07/kmiza27`
- **Branch**: `main`
- **Build Path**: `/`

### 3.3 Configurar Build
Na aba **"Build"**:
- **Build Method**: `Dockerfile`
- **Dockerfile Path**: `Dockerfile`
- **Build Context**: `/` (raiz do projeto)

### 3.4 Configurar Environment Variables
Na aba **"Environment"**:

```env
# Aplicação
NODE_ENV=production
PORT=3000

# Database (pegar das credenciais do PostgreSQL)
DATABASE_URL=postgresql://kmiza27_user:sua_senha_forte_aqui@kmiza27-db:5432/kmiza27_chatbot

# Redis (pegar das credenciais do Redis)
REDIS_URL=redis://:sua_senha_redis_aqui@kmiza27-redis:6379

# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Evolution API
EVOLUTION_API_URL=https://kmiza27-evolution.h4xd66.easypanel.host
EVOLUTION_API_KEY=95DC243F41B2-4858-B0F1-FF49D8C46A85
EVOLUTION_INSTANCE=kmizabot

# Segurança
JWT_SECRET=seu_jwt_secret_muito_forte_aqui
COOKIE_SECRET=seu_cookie_secret_muito_forte_aqui

# Webhook (configurar após deploy)
WEBHOOK_URL=https://seu-dominio.com/chatbot/webhook
```

### 3.5 Configurar Networking
Na aba **"Networking"**:
- **Port**: `3000`
- **Domain**: Configure seu domínio ou use o IP

### 3.6 Deploy
1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Verifique os logs na aba **"Deployments"**

## 🎨 Passo 4: Deploy do Frontend (Opcional)

### 4.1 Criar App Frontend
1. Clique em **"+ Service"** → **"App"**
2. **Service Name**: `kmiza27-frontend`

### 4.2 Configurar Source
- **Repository**: `https://github.com/designativa07/kmiza27`
- **Branch**: `main`
- **Build Path**: `/frontend`

### 4.3 Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://seu-dominio-backend.com
```

### 4.4 Configurar Port
- **Port**: `3001`

## 🔗 Passo 5: Configurar Webhook

### 5.1 Obter URL do Backend
Após o deploy, você terá uma URL como:
- `https://kmiza27-backend.seu-dominio.com`
- ou `http://seu-ip:3000`

### 5.2 Executar Script de Configuração
No terminal do Easypanel ou localmente:

```bash
# Configurar variável de ambiente
export WEBHOOK_URL="https://kmiza27-backend.seu-dominio.com/chatbot/webhook"

# Executar configuração
node configure-webhook-easypanel.js
```

## 🔒 Passo 6: Configurar SSL (Recomendado)

### 6.1 SSL Automático
O Easypanel configura SSL automaticamente com Let's Encrypt se você:
1. Tiver um domínio configurado
2. O domínio apontar para o IP da VPS
3. As portas 80 e 443 estiverem abertas

### 6.2 Verificar SSL
```bash
# Testar HTTPS
curl -I https://seu-dominio.com/health
```

## 📊 Passo 7: Monitoramento

### 7.1 Verificar Status dos Serviços
No Easypanel, verifique:
- ✅ PostgreSQL: Running
- ✅ Redis: Running  
- ✅ Backend: Running
- ✅ Frontend: Running (se configurado)

### 7.2 Testar Endpoints
```bash
# Health check
curl https://seu-dominio.com/health

# Teste de produtos (deve retornar JSON)
curl https://seu-dominio.com/store/products
```

### 7.3 Verificar Logs
No Easypanel:
1. Clique no serviço
2. Aba **"Logs"**
3. Monitore erros e atividade

## 🤖 Passo 8: Testar o Chatbot

### 8.1 Verificar Conexão WhatsApp
```bash
# Verificar status da instância
curl -H "apikey: 95DC243F41B2-4858-B0F1-FF49D8C46A85" \
     https://kmiza27-evolution.h4xd66.easypanel.host/instance/connectionState/kmizabot
```

### 8.2 Testar Mensagem
Envie uma mensagem para o WhatsApp conectado:
- "Palmeiras"
- "próximos jogos"
- "tabela brasileirão"

## 🔄 Passo 9: Auto-Deploy (Opcional)

### 9.1 Configurar Auto-Deploy
No Easypanel:
1. Vá para o app
2. Aba **"Source"**
3. Ative **"Auto Deploy"**
4. Escolha a branch (main)

### 9.2 Webhook do GitHub
Configure webhook no GitHub para deploy automático:
- URL: `https://easypanel-webhook-url`
- Events: `push`

## 🛠️ Comandos Úteis

### Verificar Status
```bash
# Status dos containers
docker ps

# Logs do backend
docker logs kmiza27-backend

# Logs do banco
docker logs kmiza27-db
```

### Backup do Banco
```bash
# Backup automático (configurar no Easypanel)
# Ou manual:
docker exec kmiza27-db pg_dump -U kmiza27_user kmiza27_chatbot > backup.sql
```

### Restart de Serviços
No Easypanel:
1. Clique no serviço
2. **"Actions"** → **"Restart"**

## 🚨 Troubleshooting

### Problema: Dockerfile não encontrado
**Erro**: `failed to read dockerfile: open Dockerfile: no such file or directory`

**Solução:**
1. Verificar se o `Dockerfile` está na raiz do projeto
2. Fazer commit e push das mudanças:
   ```bash
   git add Dockerfile
   git commit -m "Add Dockerfile for Easypanel"
   git push origin main
   ```
3. Fazer redeploy no Easypanel

### Problema: App não inicia
**Solução:**
1. Verificar logs no Easypanel
2. Conferir variáveis de ambiente
3. Verificar se banco está rodando
4. Testar com: `node test-easypanel-deployment.js`

### Problema: Webhook não funciona
**Solução:**
1. Verificar URL do webhook
2. Testar conectividade
3. Verificar logs da Evolution API
4. Executar: `node configure-webhook-easypanel.js`

### Problema: SSL não funciona
**Solução:**
1. Verificar DNS do domínio
2. Aguardar propagação (até 24h)
3. Verificar portas 80/443

### Problema: Build falha
**Solução:**
1. Verificar se todas as dependências estão no package.json
2. Verificar se o Node.js está na versão correta (18+)
3. Limpar cache e tentar novamente

## 📈 Otimizações de Produção

### 1. Recursos
- **CPU**: 2+ cores
- **RAM**: 4GB+ recomendado
- **Storage**: SSD para melhor performance

### 2. Backup
- Configure backup automático no Easypanel
- Backup diário do banco de dados
- Backup dos arquivos de configuração

### 3. Monitoramento
- Configure alertas de CPU/RAM
- Monitor de uptime
- Logs centralizados

### 4. Segurança
- Firewall configurado
- SSL obrigatório
- Senhas fortes
- Atualizações regulares

## ✅ Checklist Final

- [ ] PostgreSQL rodando
- [ ] Redis rodando
- [ ] Backend deployado
- [ ] Frontend deployado (opcional)
- [ ] SSL configurado
- [ ] Webhook configurado
- [ ] WhatsApp conectado
- [ ] Chatbot respondendo
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🎉 Conclusão

Seu chatbot kmiza27 está agora rodando em produção no Easypanel! 

**URLs importantes:**
- Backend: `https://seu-dominio.com`
- Frontend: `https://frontend.seu-dominio.com`
- Webhook: `https://seu-dominio.com/chatbot/webhook`

**Próximos passos:**
1. Configurar domínio personalizado
2. Implementar monitoramento avançado
3. Configurar backup automático
4. Otimizar performance

🤖 **O kmiza27-chatbot está pronto para atender seus usuários!** 