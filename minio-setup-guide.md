# 🔧 Guia Completo: Configurar MinIO e CDN

## 🚨 Problema Identificado
O CDN `cdn.kmiza27.com` não está funcionando porque:
1. **Bucket MinIO não é público** - Todas as URLs retornam HTML em vez de imagens
2. **CORS não configurado** - Bloqueando acesso cross-origin
3. **CDN não configurado** - Não está fazendo proxy para MinIO

## 🎯 Soluções (Por Prioridade)

### **Solução 1: Configurar Bucket Público no MinIO** ⭐ **RECOMENDADA**

#### Passo 1: Acessar Console MinIO
```
URL: https://console-kmiza27-minio.h4xd66.easypanel.host
Credenciais: Usar as do EasyPanel
```

#### Passo 2: Configurar Bucket como Público
1. Ir em **"Buckets"** → **"img"**
2. Clicar em **"Manage"** → **"Access Rules"**
3. Adicionar regra:
   - **Effect**: Allow
   - **Principal**: *
   - **Action**: s3:GetObject
   - **Resource**: arn:aws:s3:::img/*

#### Passo 3: Configurar CORS
1. Ir em **"Configuration"** → **"CORS"**
2. Adicionar regra CORS:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

#### Passo 4: Testar URLs
Após configurar, testar:
```
https://console-kmiza27-minio.h4xd66.easypanel.host/img/escudos/abc-de-natal.svg
```

### **Solução 2: Configurar CDN Proxy** 

#### Opção A: Nginx/Cloudflare
Configurar `cdn.kmiza27.com` para fazer proxy para:
```
upstream minio {
  server console-kmiza27-minio.h4xd66.easypanel.host;
}

server {
  listen 443 ssl;
  server_name cdn.kmiza27.com;
  
  location / {
    proxy_pass https://console-kmiza27-minio.h4xd66.easypanel.host;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

#### Opção B: Cloudflare Workers
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const minioUrl = `https://console-kmiza27-minio.h4xd66.easypanel.host${url.pathname}`
  
  return fetch(minioUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
}
```

### **Solução 3: Usar URLs Diretas do MinIO** 

Atualizar CDN para usar URLs diretas:
```typescript
// Em cdn-simple.ts
const CDN_BASE = 'https://console-kmiza27-minio.h4xd66.easypanel.host';
```

## 🧪 Scripts de Teste

### Testar se MinIO está público:
```bash
curl -I "https://console-kmiza27-minio.h4xd66.easypanel.host/img/escudos/abc-de-natal.svg"
```

**Esperado**: `Content-Type: image/svg+xml`
**Atual**: `Content-Type: text/html`

### Testar CDN:
```bash
curl -I "https://cdn.kmiza27.com/img/escudos/abc-de-natal.svg"
```

## 🔄 Implementação Imediata

### 1. Solução Temporária (Já implementada)
```typescript
// futepedia-frontend/src/lib/cdn-simple.ts
const CDN_BASE = 'https://api.kmiza27.com'; // Backend como CDN
```

### 2. Após configurar MinIO
```typescript
// Reverter para MinIO direto
const CDN_BASE = 'https://console-kmiza27-minio.h4xd66.easypanel.host';
```

### 3. Após configurar CDN
```typescript
// Usar CDN definitivo
const CDN_BASE = 'https://cdn.kmiza27.com';
```

## 📋 Checklist de Implementação

- [ ] **Configurar bucket público no MinIO**
- [ ] **Configurar CORS no MinIO**
- [ ] **Testar URLs diretas do MinIO**
- [ ] **Configurar proxy CDN (opcional)**
- [ ] **Atualizar código para usar URL correta**
- [ ] **Testar site em produção**

## 🎯 URL Final Esperada

Após configuração completa:
```
https://cdn.kmiza27.com/img/escudos/abc-de-natal.svg
↓ (proxy para)
https://console-kmiza27-minio.h4xd66.easypanel.host/img/escudos/abc-de-natal.svg
```

## 🚀 Próximos Passos

1. **Configure o bucket público no MinIO** usando o console
2. **Teste as URLs** para verificar se funcionam
3. **Atualize o código** para usar a URL correta
4. **Configure o CDN** (opcional, para melhor performance) 