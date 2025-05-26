# 🔧 Correção da Configuração da API do Frontend

## 🚨 Problema Identificado

O frontend estava funcionando perfeitamente (carregando, tema aplicado, interface responsiva), mas **todas as chamadas de API estavam falhando** com erro `ERR_CONNECTION_REFUSED` porque estavam tentando se conectar a `http://localhost:3000` em vez do backend correto no Easypanel.

### Logs do Erro:
```
GET http://localhost:3000/whatsapp/status net::ERR_CONNECTION_REFUSED
GET http://localhost:3000/users net::ERR_CONNECTION_REFUSED
GET http://localhost:3000/teams net::ERR_CONNECTION_REFUSED
GET http://localhost:3000/matches net::ERR_CONNECTION_REFUSED
```

## ✅ Solução Implementada

### 1. **Arquivo de Configuração Centralizada**
Criado `frontend/src/config/api.ts` com:
- Detecção automática do ambiente (desenvolvimento vs produção)
- URL correta do backend: `https://kmizabot.h4xd66.easypanel.host`
- Endpoints organizados por módulo (WhatsApp, Users, Teams, etc.)
- Helper para URLs de imagens

### 2. **Atualização do Dockerfile (v8.12)**
- Variável de ambiente `NEXT_PUBLIC_API_URL` definida durante o build
- Configuração forçada no runtime via script de startup
- Logs detalhados mostrando a URL da API sendo usada

### 3. **Componentes Atualizados**
- `WhatsAppConversations.tsx` atualizado para usar `API_ENDPOINTS`
- Todas as chamadas hardcoded para `localhost:3000` substituídas
- Import da configuração centralizada

## 🔄 Como Funciona

### Desenvolvimento:
```typescript
// Usa localhost para desenvolvimento local
const API_URL = 'http://localhost:3000'
```

### Produção:
```typescript
// Usa o backend do Easypanel
const API_URL = 'https://kmizabot.h4xd66.easypanel.host'
```

### Exemplo de Uso:
```typescript
// Antes (hardcoded):
fetch('http://localhost:3000/whatsapp/conversations')

// Depois (configurável):
fetch(API_ENDPOINTS.whatsapp.conversations())
```

## 📋 Próximos Passos

1. **Deploy da Nova Versão**:
   ```bash
   # No Easypanel, fazer rebuild do frontend com Dockerfile.frontend v8.12
   ```

2. **Verificar Logs**:
   ```
   ✅ FORCED API URL: https://kmizabot.h4xd66.easypanel.host
   🔧 API Configuration: { baseUrl: "https://kmizabot.h4xd66.easypanel.host", environment: "production" }
   ```

3. **Testar Funcionalidades**:
   - Dashboard deve carregar estatísticas reais
   - WhatsApp deve mostrar conversas
   - Todas as seções devem funcionar

## 🎯 Resultado Esperado

Após o deploy da v8.12:
- ✅ Frontend continua funcionando na porta 3002
- ✅ Todas as chamadas de API vão para o backend correto
- ✅ Dashboard carrega dados reais
- ✅ WhatsApp mostra conversas reais
- ✅ Sem mais erros `ERR_CONNECTION_REFUSED`

## 🔍 Verificação

No console do navegador, você deve ver:
```
🔧 API Configuration: {
  baseUrl: "https://kmizabot.h4xd66.easypanel.host",
  environment: "production",
  publicApiUrl: "https://kmizabot.h4xd66.easypanel.host"
}
```

E as chamadas de API devem aparecer como:
```
GET https://kmizabot.h4xd66.easypanel.host/whatsapp/conversations
GET https://kmizabot.h4xd66.easypanel.host/users
GET https://kmizabot.h4xd66.easypanel.host/teams
```

## 📝 Arquivos Modificados

1. `frontend/src/config/api.ts` - **NOVO** arquivo de configuração
2. `frontend/src/components/WhatsAppConversations.tsx` - Atualizado para usar API_ENDPOINTS
3. `Dockerfile.frontend` - Versão 8.12 com configuração da API
4. `frontend/next.config.ts` - URL da API baseada no ambiente

## 🚀 Deploy

Para aplicar a correção:
1. Fazer commit das mudanças
2. Push para o GitHub
3. Rebuild do frontend no Easypanel
4. Verificar logs para confirmar a URL correta da API 