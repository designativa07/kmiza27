# 🚪 Configuração de Portas - Easypanel

## 🎯 **O Problema**
O erro 502 pode estar ocorrendo porque o Easypanel não sabe que nossa aplicação roda na **porta 3000**.

## 🔧 **Como Configurar no Easypanel**

### **1. Configuração de Porta no App**

**No painel do Easypanel:**

1. **Acesse seu app**: `kmiza27 / kmizabot`
2. **Vá para "Settings" ou "Configurações"**
3. **Procure por "Port" ou "Porta"**
4. **Configure**:
   ```
   Internal Port: 3000
   External Port: 80 (ou deixe automático)
   ```

### **2. Verificar Dockerfile**

**Certifique-se que o Dockerfile tem:**
```dockerfile
# Expor a porta 3000
EXPOSE 3000

# Comando para iniciar na porta 3000
CMD ["node", "dist/main.js"]
```

### **3. Variáveis de Ambiente**

**Adicione/verifique:**
```env
PORT=3000
NODE_ENV=production
```

## 🌐 **Como Funciona o Roteamento**

### **Arquitetura Correta:**
```
Internet (443/80) → Easypanel Proxy → Container (3000) → NestJS App
```

### **Configuração no Easypanel:**
- **Domínio externo**: `https://kmiza27-kmizabot.h4xd66.easypanel.host` (porta 443)
- **Porta interna**: `3000` (onde roda o NestJS)
- **Proxy automático**: Easypanel faz o redirecionamento

## 🔍 **Verificar Configuração Atual**

### **1. No Painel Easypanel:**
- Vá em **"Domains"** ou **"Domínios"**
- Verifique se está apontando para porta **3000**
- Se não estiver, configure:
  ```
  Domain: kmiza27-kmizabot.h4xd66.easypanel.host
  Port: 3000
  Path: / (raiz)
  ```

### **2. Verificar Logs:**
- Procure por mensagens como:
  ```
  ✅ Application is running on: http://localhost:3000
  ❌ Error: connect ECONNREFUSED 127.0.0.1:3000
  ```

## 🛠️ **Passos para Corrigir**

### **Passo 1: Configurar Porta no Easypanel**
1. **App Settings** → **Port Configuration**
2. **Internal Port**: `3000`
3. **Protocol**: `HTTP`
4. **Save/Salvar**

### **Passo 2: Verificar Dockerfile**
```dockerfile
# Certifique-se que tem estas linhas:
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### **Passo 3: Verificar main.ts**
```typescript
// backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  app.enableCors();
  
  // Porta da aplicação
  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0'); // ← Importante: 0.0.0.0
  console.log(`Application is running on: http://localhost:${port}`);
}
```

### **Passo 4: Rebuild e Restart**
1. **Deploy/Rebuild** o app
2. **Restart** o container
3. **Verificar logs**

## 🧪 **Teste de Verificação**

Execute este script para verificar:

```javascript
// test-port-config.js
const axios = require('axios');

async function testPortConfig() {
    console.log('🔍 Testando configuração de porta...');
    
    const tests = [
        'https://kmiza27-kmizabot.h4xd66.easypanel.host',
        'https://kmiza27-kmizabot.h4xd66.easypanel.host:3000', // Não deve funcionar
        'https://kmiza27-kmizabot.h4xd66.easypanel.host/health'
    ];
    
    for (const url of tests) {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            console.log(`✅ ${url} - Status: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${url} - Erro: ${error.response?.status || error.message}`);
        }
    }
}

testPortConfig();
```

## 📋 **Configuração Completa Esperada**

### **No Easypanel:**
```yaml
App: kmiza27-kmizabot
Domain: kmiza27-kmizabot.h4xd66.easypanel.host
Internal Port: 3000
External Port: 443 (HTTPS automático)
Protocol: HTTP
Health Check: /health
```

### **Variáveis de Ambiente:**
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=...
```

## 🎯 **Resultado Esperado**

Após configurar corretamente:
```
✅ https://kmiza27-kmizabot.h4xd66.easypanel.host → Status 200
✅ Container rodando na porta 3000
✅ Proxy Easypanel funcionando
✅ SSL automático ativo
```

## 🚨 **Se Ainda Não Funcionar**

### **Opção 1: Verificar Health Check**
```typescript
// Adicione endpoint de health no NestJS
@Get('health')
getHealth() {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  };
}
```

### **Opção 2: Debug de Porta**
```typescript
// No main.ts, adicione logs:
console.log('🚀 Starting application...');
console.log('📡 Port:', process.env.PORT || 3000);
console.log('🌐 Host: 0.0.0.0');
```

### **Opção 3: Configuração Manual**
Se o Easypanel não detectar automaticamente:
1. **Domains** → **Add Domain**
2. **Domain**: `kmiza27-kmizabot.h4xd66.easypanel.host`
3. **Target**: `http://localhost:3000`
4. **Save**

## 📞 **Próximo Passo**

Vá no painel do Easypanel e verifique/configure a porta 3000 para seu app! 🎯 