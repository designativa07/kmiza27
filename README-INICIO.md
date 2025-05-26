# 🚀 Chatbot Kmiza27 - Guia de Início Rápido

## 📋 Como Iniciar o Sistema Completo

### Opção 1: Script Automático (Recomendado)

#### Windows Batch (.bat)
```bash
# Clique duplo no arquivo ou execute no terminal:
start-all.bat
```

#### PowerShell (.ps1)
```powershell
# Execute no PowerShell:
.\start-all.ps1
```

### Opção 2: Manual

#### 1. Backend (Porta 3000)
```bash
cd backend
npm install
npm run start:dev
```

#### 2. Frontend (Porta 3001)
```bash
cd frontend
npm install
npm run dev
```

#### 3. Ngrok (Túnel Público)
```bash
cd backend
.\ngrok.exe config add-authtoken 2xZJeYu9bW6t25EKMmzKkm9eb10_6kWbCsXFgzyUyz2NvyXBo
.\ngrok.exe http 3000
```

## 🌐 URLs do Sistema

- **Backend API**: http://localhost:3000
- **Frontend Admin**: http://localhost:3001
- **Ngrok Dashboard**: http://localhost:4040
- **Webhook URL**: `{ngrok_url}/chatbot/webhook`

## 🔧 Configuração do Webhook

### Automática
O script `start-all.ps1` configura automaticamente o webhook na Evolution API.

### Manual
1. Obtenha a URL pública do ngrok em: http://localhost:4040
2. Configure na Evolution API:
   ```
   URL: https://xxxxx.ngrok.io/chatbot/webhook
   Eventos: MESSAGES_UPSERT
   ```

## 📱 Testando o Sistema

### 1. Verificar Status
```bash
curl http://localhost:3000/chatbot/status
```

### 2. Simular Mensagem WhatsApp
```bash
curl -X POST http://localhost:3000/chatbot/simulate-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+5511999999999", "message": "próximo jogo do flamengo"}'
```

### 3. Testar Webhook
```bash
curl -X POST http://localhost:3000/chatbot/webhook \
  -H "Content-Type: application/json" \
  -d '{"data": {"messages": [{"key": {"remoteJid": "5511999999999@s.whatsapp.net"}, "message": {"conversation": "oi"}}]}}'
```

## 🎯 Funcionalidades do Chatbot

- ✅ **Próximos jogos**: "próximo jogo do flamengo"
- ✅ **Informações do time**: "informações do palmeiras"
- ✅ **Jogos de hoje**: "jogos de hoje"
- ✅ **Tabela do campeonato**: "tabela do brasileirão"
- ✅ **Saudações**: "oi", "olá", "bom dia"

## 🔍 Logs e Monitoramento

- **Backend**: Console do terminal onde foi iniciado
- **Frontend**: Console do navegador (F12)
- **Ngrok**: Dashboard em http://localhost:4040
- **Evolution API**: Logs na própria plataforma

## 🛠️ Solução de Problemas

### Porta já em uso
```bash
# Parar todos os processos Node.js
Get-Process -Name "node" | Stop-Process -Force

# Parar ngrok
Get-Process -Name "ngrok" | Stop-Process -Force
```

### Ngrok não conecta
1. Verifique o auth token
2. Reinicie o ngrok
3. Verifique firewall/antivírus

### Webhook não recebe mensagens
1. Verifique se a URL está correta na Evolution API
2. Teste o endpoint manualmente
3. Verifique logs do backend

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs nos terminais
2. Teste os endpoints individualmente
3. Verifique a conectividade da Evolution API 