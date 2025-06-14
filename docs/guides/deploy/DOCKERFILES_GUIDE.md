# 🐳 Guia dos Dockerfiles - EasyPanel

## 📋 **Qual Dockerfile usar para cada serviço:**

### 🎨 **Frontend Service (Next.js)**
- **Dockerfile**: `Dockerfile.frontend`
- **Porta**: 3002
- **Build Path**: `/` (raiz do projeto)
- **Service Name**: `kmiza27-frontend`

### 🚀 **Backend Service (NestJS)**
- **Dockerfile**: `Dockerfile.backend`
- **Porta**: 3000
- **Build Path**: `/` (raiz do projeto)
- **Service Name**: `kmiza27-backend`

## ⚙️ **Configuração no EasyPanel:**

### **Para o Frontend:**
1. Criar novo App Service
2. **Source**: GitHub repo `designativa07/kmiza27`
3. **Build Method**: Dockerfile
4. **Dockerfile Path**: `Dockerfile.frontend`
5. **Port**: 3002

### **Para o Backend:**
1. Criar novo App Service
2. **Source**: GitHub repo `designativa07/kmiza27`
3. **Build Method**: Dockerfile
4. **Dockerfile Path**: `Dockerfile.backend`
5. **Port**: 3000

## 🗂️ **Arquivos de Dockerfile:**

- ✅ `Dockerfile.frontend` → Frontend Next.js (porta 3002)
- ✅ `Dockerfile.backend` → Backend NestJS (porta 3000)
- 🗑️ `Dockerfile.backend.old` → Backup do Dockerfile principal antigo

## 🎯 **Resultado:**

Agora cada serviço tem seu Dockerfile específico e não há mais confusão sobre qual usar!

### **Deploy Separado e Organizado:**
- Frontend e Backend são independentes
- Builds mais rápidos e específicos
- Fácil manutenção e debugging
- Escalabilidade individual

## 🚨 **IMPORTANTE:**

Se você já tem serviços configurados no EasyPanel:
1. Verifique se estão usando o Dockerfile correto
2. Se necessário, reconfigure o **Dockerfile Path**
3. Faça rebuild após a correção 