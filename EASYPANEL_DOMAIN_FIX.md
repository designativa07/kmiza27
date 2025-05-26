# 🌐 CORREÇÃO: Frontend abrindo no domínio principal

## 🚨 PROBLEMA:
O frontend está abrindo em `195.200.0.191:3000` ao invés de um subdomínio específico.

## 🔧 SOLUÇÃO NO EASYPANEL:

### **1. Configuração INCORRETA (atual):**
```
Service: kmizafront
Domain: 195.200.0.191 (ou domínio principal)
Port: 3000
```
**Resultado**: Frontend captura TODAS as requisições do IP/domínio principal

### **2. Configuração CORRETA:**
```
Service: kmizafront
Domain: app.seudominio.com (ou frontend.seudominio.com)
Port: 3002
```
**Resultado**: Frontend só responde no subdomínio específico

## 📋 PASSOS PARA CORRIGIR:

### **Passo 1: Acessar Easypanel**
- Tente: `http://195.200.0.191:8080`
- Ou pare o container frontend via SSH

### **Passo 2: Reconfigurar o Frontend**
1. Vá no serviço **kmizafront**
2. **Settings** → **Domains**
3. **REMOVER** o domínio principal
4. **ADICIONAR** um subdomínio específico:
   - `app.seudominio.com`
   - `frontend.seudominio.com`
   - `chatbot.seudominio.com`

### **Passo 3: Configurar Porta**
1. **Settings** → **General**
2. **Port**: `3002` (não 3000!)

### **Passo 4: Configurar DNS (se necessário)**
No seu provedor de DNS, adicione:
```
Type: A
Name: app (ou frontend)
Value: 195.200.0.191
TTL: 300
```

## 🎯 RESULTADO ESPERADO:

- **Easypanel**: `http://195.200.0.191:3000` ou `http://seudominio.com`
- **Backend**: `http://195.200.0.191:3001` ou `http://api.seudominio.com`
- **Frontend**: `http://app.seudominio.com` (porta 3002 internamente)

## 🚨 CONFIGURAÇÕES CRÍTICAS:

### **No Easypanel - Service Settings:**
```
Name: kmizafront
Image: easypanel/kmiza27/kmizafront
Port: 3002
Domain: app.seudominio.com
Environment Variables:
  PORT=3002
  NODE_ENV=production
  HOSTNAME=0.0.0.0
```

### **Proxy Configuration:**
- **Host**: `app.seudominio.com`
- **Target**: `http://container:3002`
- **HTTPS**: Enabled
- **Force HTTPS**: Enabled

## 🔍 VERIFICAÇÃO:

Após a correção:
1. `http://195.200.0.191:3000` → Easypanel
2. `http://195.200.0.191:3001` → Backend
3. `http://app.seudominio.com` → Frontend

## 💡 DICA:
Se não tiver domínio próprio, use subdomínio do IP:
- `app-195-200-0-191.nip.io` (serviço gratuito de DNS wildcard) 