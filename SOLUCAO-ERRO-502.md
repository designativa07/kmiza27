# 🚨 Solução para Erro 502 - Easypanel

## 📋 **Diagnóstico**
- ❌ **Status**: Erro 502 (Bad Gateway) em todos os endpoints
- 🐳 **Causa**: Container não está rodando ou aplicação não iniciou
- 🌐 **Domínio afetado**: `https://kmiza27-kmizabot.h4xd66.easypanel.host`

## 🔧 **Soluções Passo a Passo**

### **1. Verificar Status no Easypanel**

**No painel do Easypanel:**
1. Acesse seu app `kmiza27 / kmizabot`
2. Verifique se o status está **"Running"** (verde)
3. Se estiver **"Stopped"** ou **"Error"** (vermelho), continue

### **2. Verificar Logs**

**No Easypanel:**
1. Clique na aba **"Logs"**
2. Procure por erros como:
   ```
   Error: Cannot find module
   Error: ECONNREFUSED (banco de dados)
   Error: Port 3000 already in use
   npm ERR! missing script: start
   ```

### **3. Verificar Variáveis de Ambiente**

**Variáveis obrigatórias:**
```env
# Banco de dados
DATABASE_URL=postgresql://user:password@postgres:5432/kmiza27_db
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=kmiza27_db

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# Evolution API
EVOLUTION_API_URL=https://kmiza27-evolution.h4xd66.easypanel.host
EVOLUTION_API_KEY=95DC243F41B2-4858-B0F1-FF49D8C46A85
EVOLUTION_INSTANCE=kmizabot

# Aplicação
NODE_ENV=production
PORT=3000
```

### **4. Verificar Dockerfile**

**Problemas comuns:**
- ✅ **Porta correta**: `EXPOSE 3000`
- ✅ **Comando start**: `CMD ["node", "dist/main.js"]`
- ✅ **Build bem-sucedido**: `RUN npm run build`

### **5. Soluções Rápidas**

#### **Solução A: Reiniciar Container**
1. No Easypanel, clique em **"Restart"**
2. Aguarde 2-3 minutos
3. Teste: `https://kmiza27-kmizabot.h4xd66.easypanel.host/health`

#### **Solução B: Rebuild da Aplicação**
1. Clique em **"Deploy"** ou **"Rebuild"**
2. Aguarde o build completar
3. Verifique logs durante o build

#### **Solução C: Verificar Banco de Dados**
1. Certifique-se que o serviço **PostgreSQL** está rodando
2. Verifique se as credenciais estão corretas
3. Teste conexão com banco

### **6. Configuração de Serviços**

**Se não tiver PostgreSQL configurado:**

```yaml
# No Easypanel, adicione serviço PostgreSQL:
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: kmiza27_db
      POSTGRES_USER: kmiza27_user
      POSTGRES_PASSWORD: sua_senha_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### **7. Dockerfile Corrigido**

Se o problema persistir, use este Dockerfile:

```dockerfile
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++ curl dumb-init

WORKDIR /app

# Copiar package.json
COPY backend/package.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps --force

# Copiar código
COPY backend/ ./
COPY database/ ./database/

# Build
RUN npm run build

# Usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### **8. Script de Teste**

Execute para verificar se foi resolvido:

```bash
node test-easypanel-status.js
```

### **9. Verificação Final**

**Endpoints que devem funcionar:**
- ✅ `https://kmiza27-kmizabot.h4xd66.easypanel.host/health`
- ✅ `https://kmiza27-kmizabot.h4xd66.easypanel.host/api`
- ✅ `https://kmiza27-kmizabot.h4xd66.easypanel.host/chatbot/webhook`

## 🆘 **Se Nada Funcionar**

### **Opção 1: Deploy Simples**
1. Delete o app atual
2. Crie novo app com configuração mínima
3. Use apenas as dependências essenciais

### **Opção 2: Verificar Recursos**
- **RAM**: Mínimo 512MB
- **CPU**: Mínimo 0.5 vCPU
- **Disco**: Mínimo 1GB

### **Opção 3: Logs Detalhados**
```bash
# No container, execute:
npm run start:prod
# Ou
node dist/main.js
```

## 📞 **Próximos Passos**

1. **Verifique logs** no Easypanel
2. **Configure variáveis** de ambiente
3. **Reinicie** o container
4. **Teste** os endpoints
5. **Reconfigure webhook** quando funcionar

## 🎯 **Resultado Esperado**

Após a correção:
```
✅ Status: 200 - OK
📊 Resposta: {"status":"ok","timestamp":"..."}
```

Então você poderá testar o WhatsApp novamente! 📱 