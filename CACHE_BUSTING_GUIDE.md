# 🔥 Guia de Cache Busting - Kmiza27

## 🎯 Problema Resolvido

**Antes**: Precisava apertar "Force Rebuild" no Easypanel após cada push
**Agora**: Deploy automático com cache quebrado automaticamente

## ✅ Solução Implementada

### 🐳 **Dockerfiles Otimizados**

Ambos os Dockerfiles (`Dockerfile.backend` e `Dockerfile.frontend`) foram otimizados com:

#### 🔄 **Cache Busting Agressivo**
```dockerfile
# SEMPRE clonar repositório fresco (sem cache)
RUN rm -rf /tmp/repo || true
RUN git clone --depth=1 https://github.com/designativa07/kmiza27.git /tmp/repo

# Quebrar cache baseado no commit atual
RUN cd /tmp/repo && \
    CURRENT_COMMIT=$(git rev-parse HEAD) && \
    echo "$CURRENT_COMMIT" > /app/commit-cache-buster.txt

# Limpar e reinstalar dependências
RUN rm -rf node_modules package-lock.json
RUN npm install --no-cache
```

#### 📋 **Variáveis de Cache Busting**
- `GIT_COMMIT` - Hash completo do commit
- `GIT_SHORT` - Hash curto do commit  
- `BUILD_TIMESTAMP` - Timestamp do build
- `CACHE_BUSTER` - ID único por build
- `NEXT_PUBLIC_BUILD_ID` - ID único para Next.js

## 🚀 Como Usar

### **Método 1: Comando Automático (Recomendado)**
```bash
npm run deploy
```

Este comando:
1. ✅ Captura informações do commit atual
2. ✅ Atualiza arquivo de cache busting
3. ✅ Faz commit automático
4. ✅ Push para GitHub
5. ✅ Aciona deploy automático no Easypanel
6. ✅ Cache é quebrado automaticamente

### **Método 2: Comando Manual**
```bash
# Com mensagem personalizada
npm run deploy "feat: nova funcionalidade"

# Ou usando o script diretamente
bash scripts/deploy-with-cache-bust.sh "feat: nova funcionalidade"
```

### **Método 3: Git Normal (Também Funciona)**
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

O cache será quebrado automaticamente pelos Dockerfiles otimizados.

## 🔍 Verificação do Deploy

### **Verificar se Deploy Foi Aplicado**
```bash
# Backend
curl https://kmizabot.h4xd66.easypanel.host/health | jq '.commit'

# Frontend  
curl https://kmizafront.h4xd66.easypanel.host/api/health | jq '.commit'
```

### **Monitoramento em Tempo Real**
- 📊 **GitHub Actions**: https://github.com/designativa07/kmiza27/actions
- 🐳 **Backend Health**: https://kmizabot.h4xd66.easypanel.host/health
- 🎨 **Frontend Health**: https://kmizafront.h4xd66.easypanel.host/api/health
- 📱 **Dashboard**: https://kmizafront.h4xd66.easypanel.host

## 🛠️ Como Funciona

### **1. Cache Busting nos Dockerfiles**
```dockerfile
# Sempre clone fresco
RUN git clone --depth=1 https://github.com/designativa07/kmiza27.git /tmp/repo

# Commit como cache buster
RUN echo "$CURRENT_COMMIT" > /app/commit-cache-buster.txt

# Sem cache no npm
RUN npm install --no-cache
```

### **2. Arquivo de Force Rebuild**
O arquivo `.easypanel/force-rebuild.txt` é atualizado a cada deploy com:
- Timestamp único
- Hash do commit
- Cache buster ID
- Informações do build

### **3. Build IDs Únicos**
Para o Next.js:
```dockerfile
export NEXT_PUBLIC_BUILD_ID="$GIT_SHORT-$CACHE_BUSTER"
```

## 🎯 Resultados Esperados

### ✅ **O que Deve Acontecer Agora**
1. **Push para GitHub** → Deploy automático inicia
2. **Cache quebrado** → Mudanças sempre aplicadas
3. **Sem intervenção manual** → Não precisa de Force Rebuild
4. **Deploy em 3-5 minutos** → Processo otimizado
5. **Commit visível** → Hash correto nos health endpoints

### ❌ **O que NÃO Precisa Mais**
- ❌ Apertar "Force Rebuild" no Easypanel
- ❌ Parar e iniciar serviços manualmente
- ❌ Aguardar cache expirar
- ❌ Builds duplicados ou inconsistentes

## 🧪 Teste do Sistema

### **Teste Rápido**
```bash
# 1. Fazer uma mudança pequena
echo "// Test: $(date)" >> frontend/src/components/Dashboard.tsx

# 2. Deploy automático
npm run deploy "test: cache busting system"

# 3. Aguardar 3-5 minutos

# 4. Verificar se foi aplicado
curl https://kmizafront.h4xd66.easypanel.host/api/health | jq '.commit'
```

### **Teste Completo**
```bash
# Verificar status antes
npm run status:backend
npm run status:frontend

# Deploy
npm run deploy "test: complete cache busting"

# Aguardar deploy
sleep 300

# Verificar status depois
npm run status:backend
npm run status:frontend
```

## 🔧 Troubleshooting

### **Se o Deploy Não Aplicar Mudanças**

1. **Verificar logs do Easypanel**
   - Procurar por "🔄 Commit capturado"
   - Verificar se o clone foi feito
   - Confirmar que npm install rodou

2. **Verificar commit nos health endpoints**
   ```bash
   curl https://kmizabot.h4xd66.easypanel.host/health
   curl https://kmizafront.h4xd66.easypanel.host/api/health
   ```

3. **Forçar rebuild se necessário**
   ```bash
   npm run deploy:force
   ```

### **Se Houver Erro no Script**

1. **Executar manualmente**
   ```bash
   bash scripts/deploy-with-cache-bust.sh
   ```

2. **Verificar permissões**
   ```bash
   chmod +x scripts/deploy-with-cache-bust.sh
   ```

3. **Git push manual**
   ```bash
   git add .
   git commit -m "fix: manual deploy"
   git push origin main
   ```

## 📊 Logs e Debug

### **Logs Importantes nos Dockerfiles**
```
🔄 Commit capturado: abc1234 (abc1234)
⏰ Build timestamp: 2025-01-27T20:45:00Z
🔥 Cache buster: 1737999900
🏗️ Building with commit: abc1234
🚀 Iniciando com commit: abc1234
```

### **Health Endpoint Response**
```json
{
  "status": "ok",
  "commit": "abc1234",
  "timestamp": "2025-01-27T20:45:00Z",
  "buildId": "abc1234-1737999900"
}
```

## 🎉 Benefícios

- ✅ **Deploy 100% Automático** - Sem intervenção manual
- ✅ **Cache Sempre Quebrado** - Mudanças sempre aplicadas  
- ✅ **Builds Consistentes** - Mesmo código, mesmo resultado
- ✅ **Logs Melhorados** - Debug mais fácil
- ✅ **Processo Otimizado** - Deploy em 3-5 minutos
- ✅ **Monitoramento Claro** - Status visível em tempo real

---

## 🚀 **Agora é só usar `npm run deploy` e relaxar!** 🎯 