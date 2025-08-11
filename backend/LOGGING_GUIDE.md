# 📊 Guia de Configuração de Logs

Este guia explica como controlar os logs do sistema para reduzir o ruído no terminal.

## 🎯 Problema Resolvido

O sistema estava gerando muitos logs desnecessários, incluindo:
- Logs detalhados de configuração da Evolution API
- Logs verbosos do WhatsApp Service
- Logs de queries SQL do TypeORM
- Logs de rotas do NestJS
- Logs de configurações do sistema

## ✅ Soluções Implementadas

### 1. **Configuração Centralizada de Logs**
- Arquivo: `src/config/logging.config.ts`
- Controla todos os tipos de logs do sistema

### 2. **Redução de Logs Verbosos**
- **Evolution API**: Apenas logs de erro
- **WhatsApp Service**: Logs essenciais apenas
- **TypeORM**: Logs desabilitados
- **NestJS**: Apenas erros e warnings

### 3. **Script de Configuração**
- Arquivo: `scripts/configure-logging.js`
- Permite mudar rapidamente os níveis de logging

## 🚀 Como Usar

### **Configurações Disponíveis**

#### **Minimal (Recomendado para produção)**
```bash
node scripts/configure-logging.js minimal
```
- ✅ Apenas logs essenciais
- ✅ Logs de erro e warning
- ✅ Logs do WhatsApp mantidos
- ❌ Logs verbosos desabilitados

#### **Debug (Para desenvolvimento)**
```bash
node scripts/configure-logging.js debug
```
- ✅ Logs de debug habilitados
- ✅ Logs do banco de dados
- ✅ Logs de configuração
- ❌ Logs de rotas desabilitados

#### **Verbose (Para troubleshooting)**
```bash
node scripts/configure-logging.js verbose
```
- ✅ Todos os logs habilitados
- ✅ Logs detalhados de todas as operações
- ⚠️ Pode gerar muito ruído

### **Configurações por Categoria**

| Categoria | Descrição | Padrão |
|-----------|-----------|--------|
| `enableVerboseLogs` | Logs detalhados gerais | `false` |
| `enableDatabaseLogs` | Logs de queries SQL | `false` |
| `enableRouteLogs` | Logs de rotas do NestJS | `false` |
| `enableWhatsAppLogs` | Logs do WhatsApp | `true` |
| `enableConfigLogs` | Logs de configuração | `false` |

## 🔧 Configuração Manual

Se precisar ajustar configurações específicas, edite o arquivo:
```typescript
// src/config/logging.config.ts
export const loggingConfig: LoggingConfig = {
  enableVerboseLogs: false,    // Logs detalhados
  enableDatabaseLogs: false,   // Logs do banco
  enableRouteLogs: false,      // Logs de rotas
  enableWhatsAppLogs: true,    // Logs do WhatsApp
  enableConfigLogs: false,     // Logs de config
};
```

## 📈 Benefícios

### **Antes (Muitos logs)**
```
🔧 Configurações da Evolution API carregadas:
📡 URL: https://evolution.kmiza27.com
🤖 Instância: Kmiza27
🔑 API Key: 87b73696...
🔍 API Key length: 36
🚀 INICIANDO ENVIO DE MENSAGEM
📱 Para: +5511999999999
📝 Mensagem: Olá, como vai?
🏷️ Título: Notificação
⚙️ WhatsApp habilitado: true
🌐 URL da requisição: https://...
📞 Número formatado: 5511999999999
📄 Payload completo: {...}
🔑 API Key: ***SET***
📡 Status da resposta: 200
📋 Headers da resposta: {...}
✅ MENSAGEM ENVIADA COM SUCESSO!
📞 Para: 5511999999999
📋 Resposta completa: {...}
```

### **Depois (Logs limpos)**
```
📱 Enviando mensagem para: +5511999999999
✅ Mensagem enviada com sucesso para: 5511999999999
```

## 🎯 Recomendações

### **Para Desenvolvimento**
```bash
node scripts/configure-logging.js debug
```

### **Para Produção**
```bash
node scripts/configure-logging.js minimal
```

### **Para Troubleshooting**
```bash
node scripts/configure-logging.js verbose
```

## 🔄 Reiniciar Serviços

Após mudar a configuração, reinicie os serviços:

```bash
# Parar todos os processos
taskkill /f /im node.exe

# Reiniciar com nova configuração
npm run start:dev
```

## 📝 Notas Importantes

- **Erros e Warnings**: Sempre são logados, independente da configuração
- **WhatsApp**: Mantém logs essenciais por padrão
- **Performance**: Menos logs = melhor performance
- **Debugging**: Use `verbose` apenas quando necessário

## 🆘 Troubleshooting

### **Se ainda houver muitos logs:**
1. Verifique se o script foi executado corretamente
2. Reinicie os serviços
3. Verifique se não há outros processos Node.js rodando

### **Para verificar a configuração atual:**
```bash
cat src/config/logging.config.ts
```

### **Para voltar ao padrão:**
```bash
node scripts/configure-logging.js minimal
``` 