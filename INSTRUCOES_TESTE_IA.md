# 🧪 Instruções para Testar o Sistema de Respostas Inteligentes

## ✅ O que foi implementado

O chatbot agora possui um sistema inteligente de respostas em 4 camadas:

1. **📚 Base de Conhecimento Local** - Jogos, artilheiros, tabelas
2. **🤖 OpenAI** - Conhecimento geral sobre futebol
3. **🌐 Pesquisa Web** - Informações atualizadas da internet
4. **🤔 Fallback Amigável** - Menu de opções quando nada funciona

## 🔧 Pré-requisitos

### 1. Instalar Dependências

```bash
cd backend
npm install
```

Foram adicionadas as dependências:
- `openai` - SDK oficial da OpenAI
- `axios` - Cliente HTTP
- `cheerio` - Parser HTML

### 2. Configurar Chave da OpenAI

#### Obter a Chave
1. Acesse: https://platform.openai.com/signup
2. Crie conta ou faça login
3. Vá para: https://platform.openai.com/api-keys
4. Clique em "Create new secret key"
5. Copie a chave (começa com `sk-`)
6. Adicione créditos em: https://platform.openai.com/account/billing

#### Configurar no Backend

Crie ou edite o arquivo `backend/.env`:

```env
# Adicione esta linha (substitua pela sua chave real)
OPENAI_API_KEY=sk-sua-chave-aqui
```

⚠️ **IMPORTANTE**: Nunca commite a chave no Git!

## 🚀 Como Testar

### Opção 1: Teste Manual via cURL

1. **Inicie o backend:**
```bash
npm run dev:backend
```

2. **Abra outro terminal e teste:**

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/chatbot/simulate-whatsapp" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"phoneNumber":"test-123","message":"Quem foi Pelé?","origin":"site"}' | Select-Object -ExpandProperty Content

# Linux/Mac
curl -X POST http://localhost:3000/chatbot/simulate-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"test-123","message":"Quem foi Pelé?","origin":"site"}'
```

### Opção 2: Teste Manual via Interface Web

1. **Inicie o Futepédia:**
```bash
npm run dev:futepedia
```

2. **Abra o navegador:**
```
http://localhost:3003/futebot
```

3. **Teste perguntas:**
- "Quem foi Pelé?"
- "Qual é a regra do impedimento?"
- "Próximos jogos do Flamengo"
- "Últimas notícias sobre Neymar"

### Opção 3: Script de Teste Automatizado

```bash
cd backend
node test-ai-research.js
```

O script testa automaticamente 15+ perguntas de diferentes categorias.

## 🔍 Verificar se está Funcionando

### Logs do Backend

Ao iniciar o backend, você deve ver:

```
✅ OpenAI inicializado com sucesso
```

Se vir:
```
⚠️ OPENAI_API_KEY não encontrada - respostas de IA desabilitadas
```

Significa que a chave não está configurada corretamente.

### Durante os Testes

Os logs mostrarão o fluxo:

```
🔍 Tentando base de conhecimento local para: "Quem foi Pelé?"
❌ Base de conhecimento não tem resposta
🤖 Tentando OpenAI para: "Quem foi Pelé?"
✅ Resposta gerada pela OpenAI
```

## 📊 Exemplos de Respostas

### Pergunta da Base Local
```
👤 Você: "Próximos jogos do Flamengo"

🤖 Bot: "📚 Encontrei a resposta usando minha base de conhecimento:

⚽ FLAMENGO - PRÓXIMOS JOGOS
📅 10/10/2025 - 16:00
🏠 Flamengo vs Vasco..."
```

### Pergunta com OpenAI
```
👤 Você: "Quem foi Pelé?"

🤖 Bot: "🤖 Encontrei a resposta usando inteligência artificial:

Pelé (1940-2022) foi um dos maiores jogadores de futebol 
de todos os tempos. Conquistou 3 Copas do Mundo..."
```

### Pergunta com Pesquisa Web
```
👤 Você: "Últimas notícias sobre Neymar"

🤖 Bot: "🌐 Encontrei a resposta usando pesquisa na internet:

Segundo informações recentes, Neymar está se recuperando..."
```

## 💰 Custos Estimados

| Uso | Custo Mensal |
|-----|--------------|
| 100 perguntas/dia | ~$3 USD |
| 500 perguntas/dia | ~$10 USD |
| 1000 perguntas/dia | ~$20 USD |

Modelo usado: `gpt-4o-mini` (o mais econômico da OpenAI)

## 🛠️ Troubleshooting

### Erro: "OPENAI_API_KEY não encontrada"
- Verifique se o arquivo `.env` existe em `backend/`
- Certifique-se que a variável está escrita corretamente
- Reinicie o backend após adicionar a chave

### Erro: "OpenAI API Error: 401"
- Chave inválida ou expirada
- Gere uma nova chave no dashboard da OpenAI

### Erro: "OpenAI API Error: 429"
- Limite de requisições excedido
- Adicione créditos na conta OpenAI
- Configure limite de gastos

### Bot não usa IA
Verifique:
1. ✅ Chave está configurada no `.env`
2. ✅ Backend foi reiniciado após adicionar chave
3. ✅ Há créditos na conta OpenAI
4. ✅ Logs mostram "OpenAI inicializado com sucesso"

## 📚 Documentação Completa

Para mais informações, consulte:
- `docs/guides/config/OPENAI_SETUP.md` - Configuração detalhada
- `docs/guides/config/AI_CHATBOT_UPGRADE.md` - Visão geral das mudanças

## 🎯 Próximos Passos

Após testar:

1. ✅ Verifique se as respostas fazem sentido
2. ✅ Observe qual camada respondeu cada pergunta
3. ✅ Monitore custos em: https://platform.openai.com/usage
4. ✅ Configure limite de gastos mensal

## 💡 Dicas

- **Teste perguntas variadas** para ver todas as camadas em ação
- **Monitore os logs** para entender o fluxo
- **Configure alertas** de gastos na OpenAI
- **Use cache** - perguntas repetidas não custam nada

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs do backend
2. Consulte a documentação em `docs/guides/config/`
3. Teste com perguntas simples primeiro
4. Verifique dashboard da OpenAI

---

**Desenvolvido para Kmiza27** 🏆⚽

