# Deploy Admin Panel - Easypanel

## 🚀 Passo a Passo

### 1. Criar Novo App no Easypanel
```
App Name: kmiza27-admin-panel
Type: Node.js
Repository: (mesmo repo do projeto)
```

### 2. Build Settings
```bash
Build Command: cd admin-panel && npm install
Start Command: cd admin-panel && node server.js
```

### 3. Environment Variables
```bash
BACKEND_URL=https://seu-backend-easypanel-url.com
NODE_ENV=production
PORT=4000
```

### 4. Port Configuration
```
Container Port: 4000
Public Access: Enable
```

### 5. Domain Setup
```
Subdomain: admin.seudominio.com
SSL: Enable (automático)
```

### 6. Deploy Process
1. Push código para Git
2. Easypanel fará build automático
3. App ficará disponível em: https://admin.seudominio.com

## 🔧 Configuração de URLs

Após deploy, atualize as URLs:

### Backend App
- URL: `https://api.kmiza27.com`
- Porta: 3000

### Admin Panel App  
- URL: `https://admin.kmiza27.com`
- Porta: 4000
- BACKEND_URL: `https://api.kmiza27.com`

## 🔐 Acesso

- URL: `https://admin.kmiza27.com`
- Login: `admin_kmiza27`
- Senha: `admin@kmiza27`

## 🐛 Troubleshooting

### Erro de Conexão Backend
- Verifique BACKEND_URL nas env vars
- Confirme que backend está rodando
- Teste: `https://api.kmiza27.com/users/stats`

### App não inicia
- Verifique logs no Easypanel
- Confirme se admin-panel/package.json existe
- Verifique se todas as dependências estão instaladas

### CORS Issues
- Backend deve aceitar requests de admin.seudominio.com
- Verificar configuração CORS no backend

## 📁 Estrutura de Deploy

```
Repository Root/
├── backend/           # App 1: Backend API
├── admin-panel/       # App 2: Admin Panel  
├── frontend/          # App 3: Frontend (se existir)
└── Dockerfile.admin-panel
```

## 🔄 Processo de Update

1. Fazer alterações no código
2. Commit e push para Git
3. Easypanel rebuilda automaticamente
4. Verificar logs para confirmar deploy

---

**Importante:** Admin Panel é um serviço separado e independente! 