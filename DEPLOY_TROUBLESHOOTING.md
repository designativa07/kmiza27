# 🚀 Guia de Troubleshooting - Deploy EasyPanel

## Problema Identificado

O EasyPanel está configurado para fazer deploy automático quando há novos commits no GitHub, mas as alterações não aparecem automaticamente. É necessário fazer **Force Rebuild** + **Stop/Start** manualmente.

## ⚡ Solução Rápida

### 1. Verificar Status Atual
```bash
npm run deploy:verify
```

### 2. Se houver problemas, siga estes passos no EasyPanel:

#### Para cada serviço desatualizado:
1. **Acesse o EasyPanel Dashboard**
2. **Selecione o serviço** (kmizabot ou kmizafrontend)
3. **Clique em "Force Rebuild"** (Forçar Reconstrução)
4. **Aguarde o build completar** (pode levar alguns minutos)
5. **Clique em "Stop"** para parar o serviço
6. **Clique em "Start"** para reiniciar o serviço
7. **Verifique novamente** com `npm run deploy:verify`

## 🔍 Comandos de Monitoramento

```bash
# Verificar status completo
npm run status

# Verificar apenas backend
npm run status:backend

# Verificar apenas frontend  
npm run status:frontend

# Monitorar continuamente (atualiza a cada 10s)
npm run status:watch

# Verificar se deploy foi aplicado
npm run deploy:verify
```

## 🛠️ Possíveis Causas do Problema

### 1. **Cache do Docker**
- O EasyPanel pode estar usando imagens Docker em cache
- **Solução**: Force Rebuild limpa o cache

### 2. **Webhook não configurado corretamente**
- O GitHub pode não estar enviando webhooks para o EasyPanel
- **Solução**: Verificar configuração de webhooks no GitHub

### 3. **Build falha silenciosamente**
- O build pode estar falhando mas o serviço continua rodando a versão anterior
- **Solução**: Verificar logs de build no EasyPanel

### 4. **Variáveis de ambiente não atualizadas**
- As variáveis BUILD_TIMESTAMP e GIT_COMMIT podem não estar sendo definidas
- **Solução**: Force Rebuild garante que as variáveis sejam atualizadas

## 📊 Como Verificar se Deploy Foi Aplicado

### Método 1: Via Script
```bash
npm run deploy:verify
```

### Método 2: Via Browser
1. Acesse: https://kmizafrontend.h4xd66.easypanel.host/status
2. Verifique se os commits do Backend e Frontend são iguais
3. Compare com o commit local: `git rev-parse HEAD`

### Método 3: Via API
```bash
# Backend
curl -s https://kmizabot.h4xd66.easypanel.host/health | jq .commit

# Frontend  
curl -s https://kmizafrontend.h4xd66.easypanel.host/api/health | jq .commit

# Commit local
git rev-parse HEAD
```

## 🔄 Workflow Recomendado

1. **Fazer alterações no código**
2. **Commit e push para GitHub**
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```
3. **Aguardar 2-3 minutos** (tempo do webhook)
4. **Verificar status**
   ```bash
   npm run deploy:verify
   ```
5. **Se necessário, fazer Force Rebuild no EasyPanel**
6. **Verificar novamente**

## 🚨 Sinais de que o Deploy Não Foi Aplicado

- ❌ Commits diferentes entre Backend/Frontend e local
- ❌ Timestamp de build muito antigo
- ❌ Funcionalidades novas não aparecem
- ❌ Correções de bugs não aplicadas

## ✅ Sinais de que o Deploy Foi Aplicado

- ✅ Commits iguais em Backend, Frontend e local
- ✅ Timestamp de build recente
- ✅ Funcionalidades novas funcionando
- ✅ Status "Operacional" na página de status

## 📞 Suporte

Se o problema persistir:
1. Verificar logs de build no EasyPanel
2. Verificar configuração de webhooks no GitHub
3. Considerar configurar deploy automático via GitHub Actions
4. Contatar suporte do EasyPanel se necessário 