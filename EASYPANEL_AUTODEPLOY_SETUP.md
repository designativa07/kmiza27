
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
3. Aba **"Source"** ou **"Git"**
4. Configure:
   - **Repository**: `https://github.com/designativa07/kmiza27`
   - **Branch**: `main`
   - **Auto Deploy**: ✅ **ATIVAR**
   - **Dockerfile**: `Dockerfile.backend`
   - **Build Context**: `.` (raiz do projeto)

#### Para o Frontend (kmizafrontend):
1. Vá para o app **kmizafrontend**
2. Aba **"Source"** ou **"Git"**
3. Configure:
   - **Repository**: `https://github.com/designativa07/kmiza27`
   - **Branch**: `main`
   - **Auto Deploy**: ✅ **ATIVAR**
   - **Dockerfile**: `Dockerfile.frontend`
   - **Build Context**: `.` (raiz do projeto)

### 3. Configurar Build Settings

#### Para ambos os serviços:
1. Aba **"Build"** ou **"Settings"**
2. **Build Arguments** (opcional, mas recomendado):
   ```
   CACHEBUST=${TIMESTAMP}
   ```
3. **Auto Restart**: ✅ **ATIVAR**
4. **Health Check**: ✅ **ATIVAR**

### 4. Testar Auto-Deploy

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

## 🚨 Troubleshooting

### Se o auto-deploy não funcionar:

1. **Verificar Webhook do GitHub**:
   - Vá em Settings > Webhooks
   - Clique no webhook criado
   - Aba "Recent Deliveries"
   - Verifique se há entregas com status 200

2. **Verificar Logs do EasyPanel**:
   - Vá para o app no EasyPanel
   - Aba "Logs" ou "Build Logs"
   - Procure por erros de build

3. **Verificar Configuração do Repositório**:
   - Confirme que o repositório está público ou o EasyPanel tem acesso
   - Verifique se a branch está correta
   - Confirme que os Dockerfiles existem no caminho especificado

### Se ainda não funcionar:

1. **Método Alternativo - GitHub Actions**:
   Podemos configurar GitHub Actions para fazer deploy via API do EasyPanel

2. **Webhook Manual**:
   Configurar webhook personalizado que chama API do EasyPanel

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
