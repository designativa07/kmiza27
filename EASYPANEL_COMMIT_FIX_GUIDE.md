# 🔧 Guia para Corrigir Commit "Desconhecido" no EasyPanel

## 📋 Problema Identificado

O status do sistema está mostrando o commit como "Desconhecido" porque as variáveis de ambiente `GIT_COMMIT` e `BUILD_TIMESTAMP` não estão sendo configuradas corretamente durante o build no EasyPanel.

## ✅ Solução Implementada

### 1. Scripts Criados

- ✅ `scripts/fix-commit-status.js` - Script principal de correção
- ✅ `scripts/deploy-easypanel.ps1` - Script PowerShell para Windows
- ✅ `.env.easypanel` - Arquivo com as variáveis corretas

### 2. Variáveis Geradas

```
GIT_COMMIT=9ed01e01bed055fb0a49986a816f7cc60ca229fd
BUILD_TIMESTAMP=2025-05-27T22:51:57Z
CACHEBUST=1748375517
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://kmizabot.h4xd66.easypanel.host
```

## 🚀 Como Aplicar no EasyPanel

### Passo 1: Configurar Backend (kmizabot)

1. **Acesse o EasyPanel Dashboard**
   - URL: https://easypanel.io
   - Faça login na sua conta

2. **Vá para o serviço Backend**
   - Clique em "kmizabot" ou "Backend"
   - Vá para "Settings" ou "Configurações"

3. **Configure Build Arguments**
   - Procure por "Build Arguments" ou "Environment Variables"
   - Adicione as seguintes variáveis:

   ```
   GIT_COMMIT=9ed01e01bed055fb0a49986a816f7cc60ca229fd
   BUILD_TIMESTAMP=2025-05-27T22:51:57Z
   CACHEBUST=1748375517
   ```

4. **Salve as configurações**

### Passo 2: Configurar Frontend (kmizafrontend)

1. **Vá para o serviço Frontend**
   - Clique em "kmizafrontend" ou "Frontend"
   - Vá para "Settings" ou "Configurações"

2. **Configure Build Arguments**
   - Procure por "Build Arguments" ou "Environment Variables"
   - Adicione as **mesmas variáveis**:

   ```
   GIT_COMMIT=9ed01e01bed055fb0a49986a816f7cc60ca229fd
   BUILD_TIMESTAMP=2025-05-27T22:51:57Z
   CACHEBUST=1748375517
   ```

3. **Salve as configurações**

### Passo 3: Force Rebuild

1. **Para o Backend:**
   - Clique em "Force Rebuild" ou "Rebuild"
   - Aguarde o build completar (pode levar alguns minutos)
   - Clique em "Restart" se necessário

2. **Para o Frontend:**
   - Clique em "Force Rebuild" ou "Rebuild"
   - Aguarde o build completar (pode levar alguns minutos)
   - Clique em "Restart" se necessário

## 🔍 Como Verificar se Funcionou

### 1. Via Health Endpoints

```bash
# Backend
curl https://kmizabot.h4xd66.easypanel.host/health

# Frontend
curl https://kmizafrontend.h4xd66.easypanel.host/api/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "commit": "9ed01e01",
  "timestamp": "2025-05-27T22:51:57Z"
}
```

### 2. Via Dashboard Web

- Acesse: https://kmizafrontend.h4xd66.easypanel.host/status
- Verifique se o commit aparece como `9ed01e01` (ao invés de "Desconhecido")

### 3. Via Script Local

```bash
npm run status
```

## 🛠️ Scripts Disponíveis

```bash
# Corrigir problema do commit
npm run fix-commit

# Gerar variáveis para EasyPanel
npm run deploy:easypanel

# Verificar status atual
npm run status

# Verificar deploy
npm run deploy:verify
```

## 🔄 Para Futuros Deploys

### Automatizar o Processo

1. **Antes de cada deploy importante:**
   ```bash
   npm run deploy:easypanel
   ```

2. **Copie as novas variáveis geradas**

3. **Atualize no EasyPanel:**
   - Cole as novas variáveis
   - Faça Force Rebuild

### Variáveis que Mudam

- `GIT_COMMIT` - Muda a cada commit
- `BUILD_TIMESTAMP` - Muda a cada build
- `CACHEBUST` - Muda a cada build

### Variáveis Fixas

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://kmizabot.h4xd66.easypanel.host`

## 🚨 Troubleshooting

### Se o commit ainda aparecer como "unknown":

1. **Verifique se as variáveis foram salvas**
   - Vá nas configurações do serviço
   - Confirme que as variáveis estão lá

2. **Faça Force Rebuild novamente**
   - Às vezes é necessário fazer 2x
   - Aguarde completar totalmente

3. **Aguarde propagação**
   - Pode levar alguns minutos
   - Teste novamente após 5 minutos

4. **Verifique logs de build**
   - No EasyPanel, veja os logs de build
   - Procure por erros relacionados às variáveis

### Se o build falhar:

1. **Verifique sintaxe das variáveis**
   - Não deve ter espaços extras
   - Formato: `NOME=valor`

2. **Verifique se o commit existe**
   - O commit deve existir no repositório
   - Use um commit válido

## ✅ Resultado Final

Após aplicar essas configurações:

- ✅ Status do sistema mostrará commit correto
- ✅ Dashboard exibirá informações de build
- ✅ Health endpoints retornarão dados corretos
- ✅ Deploy será rastreável

## 📞 Suporte

Se o problema persistir:

1. Execute `npm run status` e compartilhe o resultado
2. Verifique logs de build no EasyPanel
3. Confirme que as variáveis estão configuradas corretamente
4. Teste os health endpoints diretamente

---

**Commit atual:** `9ed01e01`  
**Timestamp:** `2025-05-27T22:51:57Z`  
**Status:** ✅ Configuração pronta para aplicar 