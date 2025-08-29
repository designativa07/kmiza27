# 🧪 GUIA COMPLETO DE TESTES DO CHATBOT

## 📋 **Visão Geral**

Este diretório contém uma suíte completa de testes para todas as funcionalidades implementadas no chatbot:

- ✅ **Query Adapter** - Detecção inteligente de intenções
- ✅ **Extração de Times** - IA + fallback inteligente
- ✅ **Respostas de Competições** - Informações completas
- ✅ **Sistema de Confirmações** - Fluxo "sim" → mais detalhes
- ✅ **Slugs da Base** - Links para páginas das competições
- ✅ **Transmissões** - Canais de TV nos jogos
- ✅ **Tabela Inteligente** - Top 5 + times em risco

## 🚀 **Como Executar os Testes**

### **1. Pré-requisitos**
```bash
# Certifique-se de que o servidor está rodando
cd backend
npm run start:dev

# Em outro terminal, instale as dependências de teste
npm install axios
```

### **2. Teste Rápido (Recomendado para início)**
```bash
# Teste rápido das funcionalidades principais
node test-quick.js
```

**Resultado esperado:**
```
🚀 TESTE RÁPIDO DO CHATBOT

🔍 Testando Query Adapter...
✅ Query Adapter funcionando
📱 Resposta: [resposta do chatbot]...

🔍 Testando Resposta de Competição...
✅ Resposta de competição funcionando
✅ Estrutura completa detectada
📱 Resposta: [resposta da competição]...

🎉 Teste rápido concluído!
```

### **3. Teste Completo (Todas as funcionalidades)**
```bash
# Teste completo com todas as funcionalidades
node test-manual.js
```

**Resultado esperado:**
```
🚀 INICIANDO TESTES COMPLETOS DO CHATBOT
============================================================

🔍 Verificando conectividade com o servidor...
✅ Servidor está rodando e acessível

🧪 TESTANDO: QUERY ADAPTER - DETECÇÃO DE INTENÇÕES
==================================================

🔍 Testando: "onde vai passar botafogo?"
✅ Mensagem enviada com sucesso
📱 Resposta: [resposta completa]

🎉 TODOS OS TESTES FORAM EXECUTADOS!
============================================================
```

### **4. Testes Unitários (Jest)**
```bash
# Executar testes unitários
npm test

# Executar testes específicos
npm test -- --testNamePattern="Query Adapter"
npm test -- --testNamePattern="Competition Info"
```

## 📁 **Estrutura dos Arquivos de Teste**

### **`test-quick.js`** - Teste Rápido
- **Objetivo:** Verificação rápida das funcionalidades principais
- **Tempo:** ~30 segundos
- **Cobertura:** Funcionalidades essenciais
- **Uso:** Ideal para verificação rápida após mudanças

### **`test-manual.js`** - Teste Completo
- **Objetivo:** Teste abrangente de todas as funcionalidades
- **Tempo:** ~2-3 minutos
- **Cobertura:** 100% das funcionalidades
- **Uso:** Validação completa antes de deploy

### **`chatbot-integration.test.ts`** - Testes Unitários
- **Objetivo:** Testes automatizados com Jest
- **Tempo:** ~10 segundos
- **Cobertura:** Lógica interna dos serviços
- **Uso:** CI/CD e desenvolvimento

### **`test-config.json`** - Configuração
- **Objetivo:** Configurações centralizadas para testes
- **Conteúdo:** URLs, casos de teste, padrões esperados
- **Uso:** Configuração e manutenção dos testes

## 🧪 **Casos de Teste Implementados**

### **1. Query Adapter Service**
```typescript
// Testa detecção de intenções
'onde vai passar botafogo?' → broadcast_info
'copa do brasil' → competition_info
'tabela de classificação' → table
'artilheiros' → top_scorers
'jogos de hoje' → matches_today
```

### **2. Extração Inteligente de Times**
```typescript
// Testa extração com IA e fallback
'onde vai passar botafogo e bragantino?' → ['botafogo', 'bragantino']
'onde vai passar o criciuma?' → ['criciuma']
'qual canal vai passar santos x corinthians?' → ['santos', 'corinthians']
```

### **3. Respostas de Competições**
```typescript
// Testa estrutura completa das respostas
✅ Título da competição (🏆)
✅ Temporada (📅)
✅ Próximos jogos (📅 PRÓXIMOS JOGOS:)
✅ Top 5 da tabela (📊 TOP 5 DA TABELA:)
✅ Times em risco (⚠️ TIMES EM RISCO:)
✅ Próxima rodada (📅 PRÓXIMA RODADA:)
✅ Link da competição (📱 Info completa:)
```

### **4. Sistema de Confirmações**
```typescript
// Testa fluxo completo
'copa do brasil' → [resposta completa]
'sim' → [lista de jogos ou mais detalhes]
```

### **5. Sistema de Slugs**
```typescript
// Testa links gerados
'copa do brasil' → http://localhost:3001/copa-do-brasil/jogos
'brasileirao' → http://localhost:3001/brasileiro-serie-a/jogos
```

### **6. Tratamento de Erros**
```typescript
// Testa cenários de erro
'competicao inexistente 12345' → ❌ Competição não encontrada
'onde vai passar time inexistente?' → Tratamento apropriado
```

### **7. Performance e Concorrência**
```typescript
// Testa robustez do sistema
5 requisições simultâneas
100 extrações de times em < 1 segundo
```

## 🔍 **Como Interpretar os Resultados**

### **✅ Sucesso (Verde)**
- Funcionalidade funcionando corretamente
- Resposta contém elementos esperados
- Performance dentro dos parâmetros

### **❌ Falha (Vermelho)**
- Funcionalidade não funcionando
- Resposta não contém elementos esperados
- Erro na requisição ou processamento

### **⚠️ Avisos (Amarelo)**
- Funcionalidade funcionando parcialmente
- Resposta contém alguns elementos esperados
- Performance abaixo do esperado

## 🛠️ **Solução de Problemas**

### **Servidor não está rodando**
```bash
# Erro: ECONNREFUSED
cd backend
npm run start:dev
```

### **Dependências faltando**
```bash
# Erro: Cannot find module 'axios'
npm install axios
```

### **Porta ocupada**
```bash
# Erro: EADDRINUSE
# Verificar processos na porta 3000
netstat -ano | findstr :3000
# Parar processo
taskkill /PID [PID] /F
```

### **Banco de dados não acessível**
```bash
# Verificar conexão com banco
# Verificar variáveis de ambiente
# Verificar se PostgreSQL está rodando
```

## 📊 **Métricas de Qualidade**

### **Cobertura de Testes**
- **Funcionalidades:** 100% cobertas
- **Casos de Borda:** Incluídos
- **Tratamento de Erros:** Implementado
- **Performance:** Monitorada

### **Tempos de Resposta Esperados**
- **Query Adapter:** < 100ms
- **Extração de Times:** < 50ms
- **Resposta de Competição:** < 500ms
- **Sistema de Confirmação:** < 200ms

### **Taxa de Sucesso Esperada**
- **Funcionalidades Principais:** > 95%
- **Tratamento de Erros:** > 90%
- **Performance:** > 98%

## 🚀 **Próximos Passos**

### **1. Executar Teste Rápido**
```bash
node test-quick.js
```

### **2. Se tudo estiver OK, executar Teste Completo**
```bash
node test-manual.js
```

### **3. Executar Testes Unitários**
```bash
npm test
```

### **4. Analisar Resultados e Corrigir Problemas**

## 📞 **Suporte**

Se encontrar problemas nos testes:

1. **Verificar logs do servidor** no terminal do backend
2. **Verificar conectividade** com `http://localhost:3000/chatbot/status`
3. **Verificar banco de dados** e variáveis de ambiente
4. **Consultar documentação** no `GUIA-IA.md`

---

**🎯 Objetivo:** Garantir que todas as funcionalidades implementadas estejam funcionando corretamente antes de prosseguir com o desenvolvimento.
