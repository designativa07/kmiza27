# 🤖 Configuração do OpenAI - Respostas Inteligentes

## Visão Geral

O chatbot do Kmiza27 agora utiliza a API do OpenAI para fornecer respostas inteligentes quando não encontra informações na base de dados local. O sistema implementa um fluxo de fallback inteligente em três camadas.

## 🔄 Fluxo de Respostas

```
Pergunta do Usuário
        ↓
┌───────────────────────────────────────┐
│ 1️⃣ Base de Conhecimento Local        │
│   • Jogos e transmissões             │
│   • Artilheiros                      │
│   • Tabelas de classificação         │
└───────────────────────────────────────┘
        ↓ (se não encontrou)
┌───────────────────────────────────────┐
│ 2️⃣ OpenAI (Conhecimento Geral)       │
│   • Perguntas sobre futebol          │
│   • Regras do jogo                   │
│   • História e curiosidades          │
└───────────────────────────────────────┘
        ↓ (se não conseguiu responder)
┌───────────────────────────────────────┐
│ 3️⃣ Pesquisa Web + OpenAI             │
│   • DuckDuckGo API                   │
│   • Síntese inteligente da resposta  │
└───────────────────────────────────────┘
        ↓ (se nada funcionou)
┌───────────────────────────────────────┐
│ 4️⃣ Fallback Amigável                 │
│   • Oferecer menu de opções          │
└───────────────────────────────────────┘
```

## 🔑 Obter Chave da API OpenAI

### Passo 1: Criar Conta
1. Acesse: https://platform.openai.com/signup
2. Crie sua conta ou faça login

### Passo 2: Gerar Chave de API
1. Vá para: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. Dê um nome descritivo (ex: "Kmiza27 Chatbot")
4. Copie a chave gerada (começa com `sk-`)

⚠️ **IMPORTANTE**: Guarde a chave em local seguro! Ela só é mostrada uma vez.

### Passo 3: Adicionar Créditos
1. Acesse: https://platform.openai.com/account/billing
2. Adicione créditos ou configure pagamento automático
3. Recomendado: Configure limite de gastos mensal

## 🛠️ Configuração

### 1. Variável de Ambiente

Adicione a chave no arquivo `.env` do backend:

```bash
# Backend/.env
OPENAI_API_KEY=sk-sua-chave-aqui
```

### 2. Verificar Instalação

```bash
cd backend
npm list openai
```

Deve mostrar: `openai@4.x.x` instalado.

### 3. Reiniciar Backend

```bash
# No diretório raiz
npm run dev:backend

# Ou dentro de backend/
npm run start:dev
```

## 📊 Custos Estimados

### Modelo Utilizado: `gpt-4o-mini`

| Uso | Tokens | Custo Aproximado |
|-----|--------|------------------|
| 1 pergunta simples | ~500 tokens | $0.0001 |
| 100 perguntas/dia | ~50k tokens | $0.01/dia |
| 1000 perguntas/dia | ~500k tokens | $0.10/dia |

**Estimativa mensal**: $3-$10 USD para uso moderado.

## 🎯 Funcionalidades Implementadas

### 1. Respostas da Base Local
- ✅ Jogos e transmissões
- ✅ Artilheiros e estatísticas
- ✅ Tabelas de classificação
- ✅ Informações de times e competições

### 2. Respostas OpenAI (Conhecimento Geral)
- ✅ Regras do futebol
- ✅ História de times e jogadores
- ✅ Curiosidades e estatísticas gerais
- ✅ Comparações e análises

### 3. Pesquisa Web + OpenAI
- ✅ Notícias recentes
- ✅ Transferências de jogadores
- ✅ Resultados de jogos não cadastrados
- ✅ Informações atualizadas

## 🔧 Configuração Avançada

### Ajustar Parâmetros da IA

Edite `backend/src/modules/ai-research/ai-research.service.ts`:

```typescript
private config: ResearchConfig = {
  enabled: true,
  openAI: true,
  knowledgeBase: true,
  webSearch: true,
  maxTokens: 1500,      // Máximo de tokens por resposta
  temperature: 0.7,     // Criatividade (0.0-1.0)
  confidenceThreshold: 0.6,
};
```

### Desabilitar Funcionalidades

```typescript
// Desabilitar OpenAI (usar só base local)
openAI: false,

// Desabilitar pesquisa web
webSearch: false,

// Desabilitar tudo (modo offline)
enabled: false,
```

## 📝 Exemplos de Uso

### Perguntas que Usam Base Local
```
Usuário: "Próximos jogos do Flamengo"
Bot: 📚 Encontrei a resposta usando minha base de conhecimento:
     ⚽ Flamengo vs Vasco...
```

### Perguntas que Usam OpenAI
```
Usuário: "Quantos mundiais o Palmeiras tem?"
Bot: 🤖 Encontrei a resposta usando inteligência artificial:
     O Palmeiras tem 1 Mundial, conquistado em 1951...
```

### Perguntas que Usam Pesquisa Web
```
Usuário: "Últimas notícias sobre Neymar"
Bot: 🌐 Encontrei a resposta usando pesquisa na internet:
     Segundo informações recentes, Neymar...
```

## 🛡️ Segurança

### Boas Práticas
- ✅ **NUNCA** commite a chave no Git
- ✅ Use `.env` para armazenar credenciais
- ✅ Configure limite de gastos na OpenAI
- ✅ Monitore uso regularmente
- ✅ Revogue chaves não utilizadas

### Limites de Segurança
```typescript
// Máximo de tokens por resposta (evita custos excessivos)
maxTokens: 1500,

// Cache de respostas (evita chamadas duplicadas)
// Tamanho: 100 entradas
```

## 🔍 Monitoramento

### Logs do Sistema

O sistema loga todas as tentativas:

```bash
🔍 Tentando base de conhecimento local para: "pergunta"
✅ Resposta encontrada na base de conhecimento

🤖 Tentando OpenAI para: "pergunta"
✅ Resposta gerada pela OpenAI

🌐 Tentando pesquisa web para: "pergunta"
✅ Resposta encontrada via pesquisa web
```

### Dashboard OpenAI

Acesse: https://platform.openai.com/usage

- 📊 Visualize uso diário
- 💰 Monitore custos
- 📈 Analise padrões de uso

## ❓ Troubleshooting

### Erro: "OPENAI_API_KEY não encontrada"

**Solução:**
1. Verifique se `.env` existe em `backend/`
2. Certifique-se que a variável está configurada
3. Reinicie o backend

### Erro: "OpenAI API Error: 401"

**Solução:**
- Chave inválida ou expirada
- Gere uma nova chave no dashboard OpenAI

### Erro: "OpenAI API Error: 429"

**Solução:**
- Limite de requisições excedido
- Adicione créditos ou aguarde reset do limite

### Erro: "OpenAI API Error: 500"

**Solução:**
- Problema temporário nos servidores OpenAI
- Sistema cairá automaticamente para fallback

## 🚀 Próximos Passos

- [ ] Implementar rate limiting por usuário
- [ ] Adicionar análise de sentimento
- [ ] Melhorar cache inteligente
- [ ] Suporte a múltiplos idiomas
- [ ] Respostas personalizadas por usuário

## 📚 Referências

- [OpenAI API Docs](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

---

**Desenvolvido para Kmiza27** 🏆⚽

