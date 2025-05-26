# 🚨 INSTRUÇÕES URGENTES - DEPLOY BACKEND NO EASYPANEL

## 🔍 **Problema Identificado**

O backend **NÃO ESTÁ RODANDO** no Easypanel! A URL `https://kmizabot.h4xd66.easypanel.host` retorna 404 do Easypanel, não do NestJS.

### Evidências:
- ✅ PostgreSQL funcionando (credenciais corretas)
- ✅ Código do backend completo
- ❌ **Backend não deployado no Easypanel**
- ❌ URL não configurada

## 🚀 **SOLUÇÃO - DEPLOY DO BACKEND**

### **1. Criar Serviço no Easypanel**

1. **Acesse o Easypanel**
2. **Clique em "Criar Serviço"**
3. **Escolha "App"**
4. **Configure:**
   - **Nome**: `kmizabot` ou `backend`
   - **Source**: GitHub
   - **Repository**: `https://github.com/designativa07/kmiza27.git`
   - **Branch**: `main`
   - **Build Path**: `/`
   - **Dockerfile**: `Dockerfile.backend`

### **2. Configurar Domínio**

1. **Vá em "Domains"**
2. **Adicione domínio:**
   - **Domain**: `kmizabot.h4xd66.easypanel.host`
   - **Port**: `3000`
   - **HTTPS**: Habilitado

### **3. Configurar Variáveis de Ambiente**

No Easypanel, adicione estas variáveis:

```
NODE_ENV=production
PORT=3000
DB_HOST=195.200.0.191
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=8F1DC9A7F9CE32C4D32E88A1C5FF7
DB_DATABASE=kmiza27
```

### **4. Configurar Build**

- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Port**: `3000`

## 📋 **Checklist de Deploy**

- [ ] Serviço criado no Easypanel
- [ ] Repository conectado ao GitHub
- [ ] Dockerfile.backend configurado
- [ ] Variáveis de ambiente definidas
- [ ] Domínio `kmizabot.h4xd66.easypanel.host` configurado
- [ ] Build iniciado
- [ ] Health check funcionando (`/health`)

## 🔍 **Como Verificar se Funcionou**

### **1. Health Check**
```
GET https://kmizabot.h4xd66.easypanel.host/health
```
**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-05-26T02:07:03.000Z",
  "service": "kmiza27-chatbot",
  "version": "1.0.0",
  "port": 3000,
  "environment": "production"
}
```

### **2. Rotas da API**
```
GET https://kmizabot.h4xd66.easypanel.host/teams
GET https://kmizabot.h4xd66.easypanel.host/users
GET https://kmizabot.h4xd66.easypanel.host/whatsapp/status
```

### **3. Logs do Container**
Procure por:
```
🚀 Starting kmiza27-chatbot...
📡 Environment: production
🌐 Host: 0.0.0.0
🚪 Port: 3000
✅ Application is running on: http://0.0.0.0:3000
```

## ⚠️ **Se o Build Falhar**

### **Problemas Comuns:**

1. **Erro de dependências**:
   - Usar `npm ci --legacy-peer-deps`
   - Verificar Node.js 18

2. **Erro de build**:
   - Verificar TypeScript
   - Verificar imports

3. **Erro de conexão DB**:
   - Verificar variáveis de ambiente
   - Testar conexão PostgreSQL

## 🎯 **Resultado Esperado**

Após o deploy:
- ✅ Backend rodando em `https://kmizabot.h4xd66.easypanel.host`
- ✅ Health check funcionando
- ✅ API endpoints respondendo
- ✅ Frontend conectando corretamente

---

**Status**: 🔄 Aguardando deploy do backend no Easypanel
**Dockerfile**: `Dockerfile.backend` (criado)
**Prioridade**: 🚨 **CRÍTICA** - Frontend não funciona sem backend 