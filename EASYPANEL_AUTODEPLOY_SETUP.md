# 🔧 Configuração de Auto-Deploy no EasyPanel

## 🎯 Problema Atual
- Push para GitHub não aciona rebuild automático
- Necessário fazer Force Rebuild + Stop/Start manualmente
- Deploy não é verdadeiramente automático

## ✅ Solução: Configurar Auto-Deploy Corretamente

### 1. Configurar Webhook do GitHub

#### No GitHub (https://github.com/designativa07/kmiza27):
1. Vá em **Settings** > **Webhooks**
2. Clique em **Add webhook**
3. Configure:
   - **Payload URL**: `https://api.easypanel.io/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: (deixe vazio ou use o token do EasyPanel)
   - **Events**: Selecione "Just the push event"
   - **Active**: ✅ Marcado

### 2. Configurar Auto-Deploy no EasyPanel

#### Para o Backend (kmizabot):
1. Acesse o EasyPanel Dashboard
2. Vá para o app **kmizabot**
3. Aba **"Fonte"** (Source)
4. Configure:
   - **Fonte**: Selecione **"Github"**
   - **Proprietário**: `designativa07`
   - **Repositório**: `kmiza27`
   - **Ramo**: `main`
   - **Caminho de Build**: `/` (raiz do projeto)
   - **Dockerfile**: `Dockerfile.backend`

#### Para o Frontend (kmizafrontend):
1. Vá para o app **kmizafrontend**
2. Aba **"Fonte"** (Source)
3. Configure:
   - **Fonte**: Selecione **"Github"**
   - **Proprietário**: `designativa07`
   - **Repositório**: `kmiza27`
   - **Ramo**: `main`
   - **Caminho de Build**: `/` (raiz do projeto)
   - **Dockerfile**: `Dockerfile.frontend`

### 3. Configurar Auto-Deploy

#### Procure por uma dessas opções no EasyPanel:
- **"Auto Deploy"** ou **"Deploy Automático"**
- **"Webhook"** ou **"GitHub Webhook"**
- **"Continuous Deployment"** ou **"CD"**
- **"Auto Rebuild"** ou **"Rebuild Automático"**

#### Locais onde pode estar:
1. **Aba "Implantações"** (Deployments)
2. **Aba "Ambiente"** (Environment)
3. **Aba "Avançado"** (Advanced)
4. **Seção "Webhook" ou "Git"**

### 4. Configurações Adicionais

#### Se houver opções de Build:
- **Build Arguments**: (opcional)
- **Auto Restart**: ✅ Ativar se disponível
- **Health Check**: ✅ Ativar se disponível

### 5. Testar Auto-Deploy

#### Após configurar:
1. Faça uma mudança pequena no código
2. Commit e push:
   ```bash
   git add .
   git commit -m "test: auto-deploy configuration"
   git push origin main
   ```
3. **Aguarde 2-3 minutos**
4. Verifique se o rebuild iniciou automaticamente no EasyPanel
5. Verifique se o commit foi atualizado nos health endpoints

## 🔍 Como Encontrar Auto-Deploy no Seu EasyPanel

### Método 1: Verificar todas as abas
Procure em cada aba do seu serviço:
- ✅ **Visão Geral** - pode ter toggle de auto-deploy
- ✅ **Fonte** - onde você está agora
- ✅ **Implantações** - configurações de deploy
- ✅ **Ambiente** - variáveis e configurações
- ✅ **Domínios** - configurações de domínio
- ✅ **Avançado** - configurações avançadas

### Método 2: Procurar por palavras-chave
Procure por textos como:
- "Auto Deploy"
- "Webhook"
- "GitHub Integration"
- "Continuous Deployment"
- "Auto Rebuild"

### Método 3: Verificar configurações do repositório
Na aba **Fonte**, depois de configurar o repositório, pode aparecer:
- Toggle para "Auto Deploy"
- Opção "Deploy on Push"
- Configuração de "Webhook URL"

## 🚨 Troubleshooting

### Se não encontrar a opção de Auto-Deploy:

1. **Verificar se o repositório está conectado corretamente**:
   - Proprietário: `designativa07`
   - Repositório: `kmiza27`
   - Ramo: `main`

2. **Salvar configurações primeiro**:
   - Clique em **"Salvar"** na aba Fonte
   - Aguarde a conexão com GitHub ser estabelecida

3. **Verificar outras abas**:
   - A opção pode aparecer após salvar a configuração do repositório

4. **Verificar versão do EasyPanel**:
   - Versões mais antigas podem ter interface diferente
   - A funcionalidade pode estar em local diferente

## ✅ Resultado Esperado

Após configurar corretamente:
- ✅ Push para GitHub aciona rebuild automático
- ✅ Não precisa mais de Force Rebuild manual
- ✅ Não precisa mais de Stop/Start manual
- ✅ Deploy verdadeiramente automático
- ✅ Commit aparece corretamente no status

## 🎯 Teste Final

Execute este comando para testar:
```bash
npm run deploy
```

O script deve mostrar que o deploy foi aplicado automaticamente sem intervenção manual.
