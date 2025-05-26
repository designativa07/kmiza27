# 🎨 Deploy Frontend Next.js - Easypanel

## 🎯 **Arquitetura Completa**

```
Frontend (Next.js) ←→ Backend (NestJS) ←→ WhatsApp (Evolution API)
     ↓                      ↓
Port 3000              Port 3000
     ↓                      ↓
kmiza27-frontend      kmiza27-backend
```

## 🚀 **Passo 1: Criar Novo App no Easypanel**

### **No Painel Easypanel:**
1. **Clique em "Create App"**
2. **Nome**: `kmiza27-frontend`
3. **Source**: GitHub Repository
4. **Repository**: `https://github.com/designativa07/kmiza27`
5. **Branch**: `main`
6. **Dockerfile**: `Dockerfile.frontend`

## 🔧 **Passo 2: Configurações do App**

### **Build Settings:**
```yaml
Build Command: docker build -f Dockerfile.frontend -t kmiza27-frontend .
Port: 3000
Protocol: HTTP
```

### **Environment Variables:**
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://kmiza27-kmizabot.h4xd66.easypanel.host
```

## 🌐 **Passo 3: Configurar Domínio**

### **Domínio Automático:**
```
https://kmiza27-frontend.h4xd66.easypanel.host
```

### **Ou Domínio Personalizado:**
```
https://painel.seusite.com
```

## 📋 **Passo 4: Verificar Configuração**

### **Estrutura Esperada:**
```
📦 Easypanel Apps
├── 🎨 kmiza27-frontend (Next.js)
│   ├── Port: 3000
│   ├── Domain: kmiza27-frontend.h4xd66.easypanel.host
│   └── API URL: https://kmiza27-kmizabot.h4xd66.easypanel.host
│
└── 🔧 kmiza27-backend (NestJS)
    ├── Port: 3000
    ├── Domain: kmiza27-kmizabot.h4xd66.easypanel.host
    └── Webhook: /chatbot/webhook
```

## 🧪 **Passo 5: Testar Deploy**

### **Script de Teste:**
```javascript
// test-frontend-deploy.js
const axios = require('axios');

async function testFrontendDeploy() {
    const frontendUrl = 'https://kmiza27-frontend.h4xd66.easypanel.host';
    const backendUrl = 'https://kmiza27-kmizabot.h4xd66.easypanel.host';
    
    console.log('🧪 Testando deploy completo...');
    
    // Testar Frontend
    try {
        const frontendResponse = await axios.get(frontendUrl);
        console.log('✅ Frontend:', frontendResponse.status);
    } catch (error) {
        console.log('❌ Frontend:', error.response?.status || error.message);
    }
    
    // Testar Backend
    try {
        const backendResponse = await axios.get(`${backendUrl}/health`);
        console.log('✅ Backend:', backendResponse.status);
    } catch (error) {
        console.log('❌ Backend:', error.response?.status || error.message);
    }
    
    // Testar Comunicação Frontend → Backend
    try {
        const apiResponse = await axios.get(`${frontendUrl}/api/test`);
        console.log('✅ Frontend → Backend:', apiResponse.status);
    } catch (error) {
        console.log('⚠️ Frontend → Backend: Pode não ter rota /api/test');
    }
}

testFrontendDeploy();
```

## 🔄 **Passo 6: Atualizar Backend CORS**

O backend precisa permitir acesso do frontend:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3001',
    'https://kmiza27-frontend.h4xd66.easypanel.host', // ← Adicionar
    'https://kmiza27-kmizabot.h4xd66.easypanel.host',
    'https://kmiza27-evolution.h4xd66.easypanel.host'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

## 📱 **Passo 7: Configurar API Calls no Frontend**

### **Criar arquivo de configuração:**
```typescript
// frontend/src/config/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    health: '/health',
    teams: '/teams',
    matches: '/matches',
    standings: '/standings',
    botConfig: '/bot-config',
    notifications: '/notifications'
  }
};

export default apiConfig;
```

### **Atualizar chamadas de API:**
```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import { apiConfig } from '../config/api';

const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

## 🎯 **Resultado Final**

### **URLs Funcionais:**
- 🎨 **Frontend**: `https://kmiza27-frontend.h4xd66.easypanel.host`
- 🔧 **Backend**: `https://kmiza27-kmizabot.h4xd66.easypanel.host`
- 📱 **WhatsApp Bot**: Funcionando via webhook

### **Fluxo Completo:**
```
Usuário → Frontend → Backend → WhatsApp Bot
   ↓         ↓         ↓           ↓
 Painel   Dashboard   API      Respostas
```

## 🚨 **Problemas Comuns**

### **1. CORS Error**
```
Erro: Access to fetch blocked by CORS
Solução: Adicionar domínio do frontend no backend CORS
```

### **2. API URL Incorreta**
```
Erro: Network Error
Solução: Verificar NEXT_PUBLIC_API_URL
```

### **3. Build Error**
```
Erro: Module not found
Solução: Verificar dependências no package.json
```

## 📞 **Próximos Passos**

1. **Criar app frontend** no Easypanel
2. **Configurar variáveis** de ambiente
3. **Deploy** e aguardar build
4. **Testar** comunicação frontend ↔ backend
5. **Atualizar CORS** no backend se necessário

## 🎉 **Deploy Completo!**

Após seguir todos os passos, você terá:
- ✅ Frontend Next.js rodando
- ✅ Backend NestJS rodando  
- ✅ WhatsApp Bot funcionando
- ✅ Painel administrativo acessível 