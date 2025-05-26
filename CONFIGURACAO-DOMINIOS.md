# 🌐 Configuração de Domínios - kmiza27-chatbot

## 📋 **Status Atual**
- ✅ **App implantado**: `https://kmiza27-kmizabot.h4xd66.easypanel.host/`
- ✅ **SSL ativo**: Certificado Let's Encrypt
- ✅ **Backend funcionando**: Porta 3000 (interno)

## 🎯 **Opções de Domínio**

### **1. Usar Domínio Atual (Recomendado para testes)**
```
https://kmiza27-kmizabot.h4xd66.easypanel.host/
```
- ✅ **Pronto para usar**
- ✅ **SSL automático**
- ✅ **Sem configuração DNS necessária**

### **2. Adicionar Domínio Personalizado**

#### **Passo 1: No Easypanel**
1. Clique em **"Adicionar Domínio"**
2. Digite seu domínio: `chatbot.seusite.com`
3. Salve a configuração

#### **Passo 2: Configuração DNS**

**No seu provedor DNS (Hostinger, Cloudflare, etc.):**

```dns
# Para subdomínio (Recomendado)
CNAME chatbot kmiza27-kmizabot.h4xd66.easypanel.host

# Para domínio principal
A @ [IP_DO_EASYPANEL]
CNAME www kmiza27-kmizabot.h4xd66.easypanel.host
```

#### **Passo 3: Aguardar Propagação**
- ⏱️ **Tempo**: 5 minutos a 24 horas
- 🔍 **Verificar**: `nslookup seudominio.com`

## 🔧 **Configuração do Webhook**

### **Para Domínio Atual (Easypanel)**
```bash
node configure-webhook-easypanel.js
```

### **Para Domínio Personalizado**
1. **Edite o arquivo**: `configure-webhook-custom-domain.js`
2. **Altere a linha**:
   ```javascript
   const CUSTOM_DOMAIN = 'https://chatbot.seusite.com';
   ```
3. **Execute**:
   ```bash
   node configure-webhook-custom-domain.js
   ```

## 📊 **Exemplos de Configuração**

### **Exemplo 1: Subdomínio**
```
Domínio: chatbot.meusite.com
DNS: CNAME chatbot kmiza27-kmizabot.h4xd66.easypanel.host
Webhook: https://chatbot.meusite.com/chatbot/webhook
```

### **Exemplo 2: Domínio Principal**
```
Domínio: meusite.com
DNS: A @ [IP_EASYPANEL]
Webhook: https://meusite.com/chatbot/webhook
```

### **Exemplo 3: Subdomínio com Path**
```
Domínio: api.meusite.com
DNS: CNAME api kmiza27-kmizabot.h4xd66.easypanel.host
Webhook: https://api.meusite.com/chatbot/webhook
```

## 🔍 **Verificação e Testes**

### **1. Testar Domínio**
```bash
# Verificar DNS
nslookup seudominio.com

# Testar HTTPS
curl -I https://seudominio.com

# Testar endpoint
curl https://seudominio.com/health
```

### **2. Testar Webhook**
```bash
# Verificar configuração
curl -H "apikey: 95DC243F41B2-4858-B0F1-FF49D8C46A85" \
     https://kmiza27-evolution.h4xd66.easypanel.host/webhook/find/kmizabot

# Testar endpoint do webhook
curl -X POST https://seudominio.com/chatbot/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

## 🚨 **Problemas Comuns**

### **1. DNS não propagou**
```
Erro: Site não carrega
Solução: Aguardar até 24h ou usar DNS público (8.8.8.8)
```

### **2. SSL não ativo**
```
Erro: Certificado inválido
Solução: Aguardar Let's Encrypt gerar certificado (até 10 min)
```

### **3. Webhook não funciona**
```
Erro: Bot não responde
Solução: Verificar se o domínio está acessível e reconfigurar webhook
```

## 📱 **Configuração Completa**

### **Arquitetura Final**
```
WhatsApp → Evolution API → Seu Domínio → Backend Easypanel
```

### **URLs Importantes**
- **Frontend**: `https://seudominio.com/`
- **API**: `https://seudominio.com/api/`
- **Webhook**: `https://seudominio.com/chatbot/webhook`
- **Health**: `https://seudominio.com/health`

## 🎯 **Próximos Passos**

1. **Escolher domínio** (atual ou personalizado)
2. **Configurar DNS** (se personalizado)
3. **Atualizar webhook** com script apropriado
4. **Testar funcionamento** com mensagem WhatsApp
5. **Monitorar logs** no Easypanel

## 📞 **Suporte**

Se tiver problemas:
1. Verifique logs no Easypanel
2. Teste endpoints manualmente
3. Confirme configuração DNS
4. Verifique webhook na Evolution API 