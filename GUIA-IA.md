# === DIRETRIZES DE INTERAÇÃO PARA A IA ===
# LEIA E SIGA ESTAS REGRAS EM TODAS AS RESPOSTAS

## 1. Persona e Papel
- **Aja como um Engenheiro de Software Sênior e Arquiteto de Sistemas.**
- **Seu Tom:** Seja técnico, preciso, objetivo e proativo. Se identificar uma melhoria ou um risco potencial, aponte-o.

## 2. Tarefa Principal
- Sua tarefa é me ajudar a desenvolver, depurar e refatorar o projeto descrito abaixo.
- Use o "Guia de Contexto do Projeto" abaixo como sua única fonte de verdade sobre a arquitetura, tecnologias e padrões.

## 3. Regras de Saída (Output)
- **Linguagem:** Todo o código gerado para o backend deve ser em TypeScript. O mesmo para o frontend.
- **Clareza:** Sempre explique o *porquê* da sua sugestão, não apenas o *como*.
- **Formato:** Use blocos de código formatados em Markdown para todo e qualquer trecho de código.

## 4. Princípios de Desenvolvimento
- **Estabilidade do Backend:** O `backend` é um serviço crítico que atende múltiplos clientes (`frontend`, `futepedia-frontend` e o chatbot do WhatsApp). Ao trabalhar em um dos frontends, a regra geral é **não modificar a API do backend**. O frontend deve ser adaptado ao contrato de dados que a API já oferece. Alterações no backend são uma exceção, devem ser cuidadosamente planejadas e validadas para garantir que não quebrem nenhum dos serviços dependentes.

---
---

# === GUIA DE CONTEXTO DO PROJETO ===
# INFORMAÇÕES TÉCNICAS SOBRE O PROJETO

## 1. Visão Geral do Projeto
- **Objetivo Principal:** Desenvolver um sistema de chatbot de futebol para WhatsApp, com um painel de administração web e uma interface pública para visualização de dados (Futepédia).
- **Arquitetura:** Monorepo com três componentes principais orquestrados por um `package.json` na raiz:
  - **`backend`**: API RESTful em NestJS que serve os dados.
  - **`frontend`**: Painel Administrativo em Next.js para gerenciamento.
  - **`futepedia-frontend`**: Interface Pública em Next.js para visualização de dados de campeonatos.

## 2. Backend (`/backend`)
- **Tecnologias Principais:**
  - **Linguagem:** TypeScript
  - **Framework:** NestJS
  - **ORM:** TypeORM
- **Estrutura de Diretórios Crítica:**
  - `src/modules`: Contém a lógica de negócio principal, organizada por domínios (e.g., `auth`, `users`, `matches`).
  - `src/entities`: Contém as definições de entidades do TypeORM, que mapeiam para as tabelas do banco de dados.
  - `src/config`: Armazena configurações da aplicação.
  - `src/main.ts`: Ponto de entrada da aplicação NestJS.
  - `src/utils/cdn.util.ts`: Utilitários para conversão automática de URLs para CDN.
  - `src/interceptors/cdn-transform.interceptor.ts`: Interceptador global que converte URLs de imagem nas respostas da API.
  - `src/chatbot`: Sistema de chatbot com integração WhatsApp e chat público.
- **Autenticação e Autorização:** A autenticação é baseada em JSON Web Tokens (JWT). O serviço `AuthService` (`src/modules/auth/auth.service.ts`) gerencia a validação de usuários e a geração de tokens. A autorização é implementada através de guards do NestJS em rotas protegidas.
- **Sistema de Chatbot:**
  - **WhatsApp Integration:** Integração com Evolution API para comunicação via WhatsApp.
  - **Chat Público:** Interface de chat público no site Futepédia para usuários anônimos.
  - **Detecção de Origem:** Sistema diferencia usuários do WhatsApp (`origin: 'whatsapp'`) de usuários do site (`origin: 'site'`).
  - **Menus Adaptativos:** Menu interativo com botões para WhatsApp, menu de texto simples para site.
  - **Endpoints:** `/chatbot/simulate-whatsapp` para testes e integração com chat público.

### 2.1. Sistema de Menu WhatsApp - ESTRUTURA REFORMULADA
- **Localização Backend:** `src/modules/whatsapp-menu/`
- **Entidade:** `src/entities/whatsapp-menu-config.entity.ts`
- **Tabela:** `whatsapp_menu_configs`

#### Campos de Configuração do Menu (Funcionais no WhatsApp):
```typescript
interface MenuGeneralConfig {
  title: string;        // 🤖 Título do menu (cabeçalho)
  description: string;  // 📝 Descrição abaixo do título
  buttonText: string;   // 🔘 Texto do botão que abre o menu
  footer: string;       // Mantido para compatibilidade, mas passado corretamente para Evolution API
}
```

#### Endpoints da API:
- **GET** `/whatsapp-menu/general-config` - Buscar configurações gerais
- **POST** `/whatsapp-menu/general-config` - Salvar configurações gerais
- **GET** `/whatsapp-menu/sections` - Buscar seções do menu
- **POST** `/whatsapp-menu/configs` - Criar itens do menu

#### Estrutura da Evolution API:
```typescript
// Payload enviado para Evolution API
const payload = {
  number: phoneNumber,
  title: config.title,           // Título principal
  description: config.description, // Descrição do menu
  buttonText: config.buttonText,   // Texto do botão
  footerText: config.footer,       // Rodapé (agora configurável)
  sections: menuSections           // Seções organizadas
}
```

#### Fluxo de Configuração:
1. **Painel Admin:** Frontend salva configurações via `/whatsapp-menu/general-config`
2. **Armazenamento:** Dados salvos na tabela `whatsapp_menu_configs` com IDs especiais:
   - `MENU_GENERAL_TITLE`
   - `MENU_GENERAL_DESCRIPTION` 
   - `MENU_GENERAL_BUTTON_TEXT`
   - `MENU_GENERAL_FOOTER`
3. **Chatbot:** `ChatbotService.sendWelcomeMenu()` busca configurações e envia via Evolution API
4. **Evolution API:** Processa e envia menu formatado para WhatsApp

#### Comandos do Menu:
- **Prefixos de Comando:**
  - `CMD_`: Comandos diretos (ex: `CMD_JOGOS_HOJE`)
  - `MENU_`: Submenus (ex: `MENU_TABELAS_CLASSIFICACAO`)
  - `COMP_`: Competições dinâmicas (ex: `COMP_123`)

- **Processamento:** `ChatbotService.processButtonListId()` detecta e roteia comandos
- **Detecção:** `ChatbotService.isButtonListId()` identifica IDs por prefixo

#### Interface do Painel Admin:
- **Campos Visíveis:** Título, Descrição, Texto do Botão
- **Campo Oculto:** Footer (mantido para compatibilidade)
- **Preview:** Mostra como aparece no WhatsApp real
- **Validação:** Apenas campos funcionais são expostos

### 2.2. Sistema de IA Research e Query Adapter - NOVA IMPLEMENTAÇÃO
- **Localização Backend:** `src/modules/ai-research/`
- **Componentes Principais:**
  - `AIResearchService`: Serviço principal para pesquisa inteligente
  - `QueryAdapterService`: Serviço para adaptar perguntas naturais para intents específicos
  - `AIResearchModule`: Módulo NestJS que organiza os serviços

#### Query Adapter Service - Funcionalidade Principal
- **Objetivo:** Mapear perguntas em linguagem natural para intents específicos do chatbot
- **Localização:** `src/modules/ai-research/query-adapter.service.ts`
- **Interface:** `QueryAdaptationResult` com campos `adapted`, `intent`, `confidence`, `reasoning`

#### Mapeamentos de Padrões Implementados:
```typescript
// Transmissões e Canais
'onde vai passar': 'broadcast_info',
'que canal vai passar': 'broadcast_info',
'em que canal': 'broadcast_info',

// Horários e Próximos Jogos  
'que horas é o jogo': 'next_match',
'quando é o jogo': 'next_match',
'próximo jogo': 'next_match',

// Tabela e Classificação
'tabela de classificação': 'table',
'classificação do brasileirão': 'table',
'posição na tabela': 'table',

// Artilheiros
'artilheiros': 'top_scorers',
'gols marcados': 'top_scorers',
'quem marcou mais gols': 'top_scorers',

// Jogos de Hoje/Semana
'jogos de hoje': 'matches_today',
'partidas da semana': 'matches_week'
```

#### Análise Semântica Inteligente:
- **Palavras-chave:** Sistema detecta palavras relacionadas a cada categoria
- **Stop Words:** Remove palavras comuns para focar no significado
- **Confiança:** Calcula nível de confiança baseado na especificidade do padrão
- **Fallback:** Se análise semântica falhar, mantém intent original do OpenAI

#### Fluxo de Processamento no Chatbot:
1. **Análise OpenAI:** `OpenAIService.analyzeMessage()` classifica intenção inicial
2. **Query Adapter:** `QueryAdapterService.adaptQueryToIntent()` tenta adaptar pergunta
3. **Sobrescrita:** Se adaptação bem-sucedida (confiança > 0.6), sobrescreve intent
4. **Processamento:** Chatbot usa intent adaptado para rotear corretamente
5. **Fallback IA:** Se intent for 'unknown' ou cair no default, chama `AIResearchService`

#### Integração com AI Research Service:
- **Dupla Proteção:** IA Research é chamada tanto no case 'unknown' quanto no default
- **Base de Conhecimento:** Pesquisa em dados locais antes de buscar na internet
- **Cache Inteligente:** Evita repetir pesquisas para as mesmas perguntas
- **Fallback Graceful:** Sempre tenta IA antes de mostrar menu padrão

#### Configuração e Controle:
- **Admin Panel:** Interface para configurar parâmetros de IA Research
- **Thresholds:** Configurável confiança mínima para adaptação (padrão: 0.6)
- **Logs Detalhados:** Sistema de debug para monitorar adaptações
- **Estatísticas:** Métricas de uso e eficácia do sistema

#### Vantagens da Implementação:
- **Melhor Aproveitamento:** Usa funcionalidades já implementadas no chatbot
- **Respostas Mais Precisas:** Aproveita lógica específica de cada intent
- **Experiência do Usuário:** Maior chance de receber resposta útil
- **Manutenibilidade:** Fácil adicionar novos padrões e mapeamentos
- **Performance:** Evita chamadas desnecessárias para IA Research

#### Exemplos de Funcionamento:
- **"onde vai passar botafogo e bragantino?"** → `broadcast_info` ✅
- **"quando é o jogo do flamengo?"** → `next_match` ✅  
- **"tabela de classificação"** → `table` ✅
- **"artilheiros do campeonato"** → `top_scorers` ✅
- **"xyz123 teste aleatorio"** → Não adaptado → IA Research ✅

- **Sistema de Comandos do Chatbot:**
  - **Arquitetura de Comandos:** Sistema baseado em identificadores únicos (`CMD_`, `MENU_`, `COMP_`) que conectam interface visual com funcionalidades do backend.
  - **Fluxo de Processamento:**
    1. **Configuração:** Comandos definidos na tabela `whatsapp_menu_configs` com metadados (título, descrição, ordem)
    2. **Detecção:** Método `isButtonListId()` identifica comandos por prefixos específicos
    3. **Roteamento:** `ChatbotService.processButtonListId()` direciona para funções específicas
  - **Tipos de Comando:**
    - `CMD_`: Comandos diretos (ex: `CMD_ARTILHEIROS`, `CMD_JOGOS_HOJE`)
    - `MENU_`: Submenus (ex: `MENU_TABELAS_CLASSIFICACAO`)
    - `COMP_`: Competições dinâmicas (ex: `COMP_123`)
  - **Adição de Novas Funcionalidades:**
    1. **Criar comando** na tabela `whatsapp_menu_configs`
    2. **Implementar lógica** no `ChatbotService`
    3. **Adicionar ao menu** via painel admin
- **CDN e Upload de Arquivos:**
  - **CDN Oficial:** `https://cdn.kmiza27.com` - Todas as URLs de imagem são automaticamente convertidas para CDN via interceptador global.
  - **MinIO Storage:** Integração com MinIO (S3-compatible) hospedado no EasyPanel para armazenamento de arquivos.
  - **Upload Service:** `src/modules/upload/upload-cloud.service.ts` gerencia URLs do CDN e MinIO.
  - **Conversão Automática:** Interceptador global converte URLs antigas (`/uploads/escudos/`) para CDN (`https://cdn.kmiza27.com/img/escudos/`).
- **Testes:** Utiliza-se Jest para testes unitários e de integração. Os scripts de teste estão definidos no `package.json` do backend.

### 2.3. Encurtamento de URLs com Shlink
- **Integração:** O sistema é integrado com uma instância auto-hospedada do Shlink para criar URLs curtas e amigáveis.
- **Localização da Lógica:** `backend/src/modules/url-shortener/url-shortener.service.ts`
- **Geração de Links para Partidas:**
  - **Função Responsável:** `createMatchShortUrl`
  - **URL de Destino:** O link longo aponta para a página de detalhes da partida no Futepédia (ex: `https://kmiza27.com/jogos/[ID_DA_PARTIDA]`).
  - **Reutilização de Links:** O sistema utiliza um **slug personalizado e determinístico** (ex: `j-123`) e a opção `findIfExists: true`. Isso garante que **o mesmo link encurtado seja gerado apenas uma vez por partida** e reutilizado em todas as solicitações subsequentes, garantindo consistência e eficiência.

## 3. Frontend - Painel Administrativo (`/frontend`)
- **Finalidade:** Interface para administradores gerenciarem todos os aspectos do sistema (times, jogadores, campeonatos, notificações, etc.).
- **Tecnologias Principais:**
  - **Framework:** Next.js (com App Router)
  - **Linguagem:** TypeScript
  - **UI:** React, Tailwind CSS
- **Estrutura de Diretórios Crítica:**
  - `src/app`: Estrutura de roteamento principal usando o App Router do Next.js.
  - `src/components`: Componentes React reutilizáveis.
  - `src/services`: Contém a lógica de comunicação com a API do backend (e.g., `authService.ts`).
  - `src/hooks`: Hooks customizados do React.
  - `src/contexts`: Provedores de Contexto React para gerenciamento de estado.
  - `src/lib/cdn.ts`: Utilitários para gerenciar URLs do CDN de imagens no painel admin.
  - `src/config/api.ts`: Configuração da API com helper para URLs de imagens via CDN.
- **Gerenciamento de Estado:** A inferência aponta para o uso de React Context API (`src/contexts`) e possivelmente hooks customizados para o gerenciamento de estado local e global.
- **Comunicação com API:** A comunicação é feita através da biblioteca `axios`. Um serviço (`src/services/authService.ts`) encapsula as chamadas para a API do backend, e um interceptor injeta o token JWT no cabeçalho `Authorization`.
- **CDN Integration:** Integração completa com CDN `https://cdn.kmiza27.com` para otimização de imagens. Inclui funções utilitárias para conversão automática de URLs e fallbacks para imagens não encontradas.
- **Monitoramento de Usuários:** O painel admin inclui uma aba de usuários que mostra todos os usuários do sistema, diferenciando origem (WhatsApp vs Site) com badges visuais.

## 4. Frontend - Futepédia (`/futepedia-frontend`)
- **Finalidade:** Interface pública para que os usuários possam visualizar informações de campeonatos, como tabelas de classificação e listas de jogos.
- **Tecnologias Principais:**
  - **Framework:** Next.js (com App Router)
  - **Linguagem:** TypeScript
  - **UI:** React, Tailwind CSS, Lucide React
- **Estrutura de Diretórios Crítica:**
  - `src/app`: Estrutura de roteamento principal, incluindo rotas dinâmicas como `[competitionSlug]/classificacao`.
  - `src/app/[competitionSlug]/layout.tsx`: Layout compartilhado para páginas de uma mesma competição.
  - `src/app/futebot/page.tsx`: Página dedicada do chat público.
  - `src/components/FutebotChat.tsx`: Componente principal do chat público.
  - `src/lib/user-utils.ts`: Utilitários para gerenciamento de UUID de usuários anônimos.
  - `src/lib/cdn-simple.ts`: Biblioteca simplificada para gerenciar URLs do CDN, compatível com SSR.
  - `src/lib/cdn.ts`: Utilitários completos do CDN com funções específicas para diferentes tipos de imagem.
- **Chat Público:**
  - **Widget Flutuante:** Botão circular no canto da tela disponível em todas as páginas.
  - **Página Dedicada:** `/futebot` - Interface completa do chat.
  - **Usuários Anônimos:** Sistema de UUID automático para identificação de usuários.
  - **Persistência:** localStorage mantém sessão do usuário entre visitas.
  - **Integração Backend:** Comunicação direta com `/chatbot/simulate-whatsapp` com `origin: 'site'`.
- **Renderização:** Primarily Server-Side Rendering (SSR) para garantir que os dados mais recentes sejam sempre exibidos e para otimização de SEO.
- **CDN Integration:** Integração completa com CDN `https://cdn.kmiza27.com`. Inclui conversão automática de URLs antigas, fallbacks para imagens não encontradas, e compatibilidade total com SSR.

## 5. Banco de Dados
- **Tipo:** PostgreSQL, conforme definido em `backend/src/data-source.ts`.
- **Schema/ORM:** O schema é gerenciado pelo TypeORM. As definições das entidades estão localizadas em `backend/src/entities` e as migrações em `backend/src/migrations`.
- **Configurações por Ambiente:**
  - **Produção:** `195.200.0.191:5433` - Database: `kmiza27`
  - **Desenvolvimento:** `localhost:5432` - Database: `kmiza27_dev` (user: `postgres`)

### 5.1. Sistema de Usuários
- **Entidade User:** Localizada em `backend/src/entities/user.entity.ts`
- **Campos Críticos:**
  - `phone_number`: `VARCHAR(100)` - Suporta números de telefone e UUIDs longos do site
  - `origin`: `VARCHAR(20)` DEFAULT `'whatsapp'` - Distingue origem do usuário
  - `name`, `email`, `is_admin`, `is_active`, `preferences`, `whatsapp_status`
- **Origens Suportadas:**
  - `'whatsapp'`: Usuários do WhatsApp (padrão)
  - `'site'`: Usuários do chat público no site

### 5.2. Migrações de Banco de Dados
- **Migrações TypeORM:** Localizadas em `backend/src/migrations/`
- **Migração Crítica:** `1737835460000-AddOriginToUsers.ts` - Adiciona campo `origin` na tabela `users`

#### Como Executar Migrações:

**Produção (195.200.0.191:5433):**
```bash
cd backend
npm run migration:run
```

**Desenvolvimento (localhost:5432):**
```bash
cd backend
npm run migration:run
```

#### Migração Manual (se necessário):
Se as migrações automáticas falharem, execute os scripts SQL manualmente:

**Para adicionar coluna `origin`:**
```sql
ALTER TABLE "users" ADD COLUMN "origin" VARCHAR(20) NOT NULL DEFAULT 'whatsapp';
COMMENT ON COLUMN "users"."origin" IS 'Origem do usuário: whatsapp ou site';
```

**Para expandir coluna `phone_number`:**
```sql
ALTER TABLE "users" ALTER COLUMN "phone_number" TYPE VARCHAR(100);
```

#### Verificação de Migrações:
```sql
-- Verificar estrutura da tabela users
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('phone_number', 'origin')
ORDER BY column_name;
```

## 6. CDN e Gerenciamento de Arquivos
- **CDN Oficial:** `https://cdn.kmiza27.com`
- **Storage Backend:** MinIO (S3-compatible) hospedado no EasyPanel
- **Estrutura de Diretórios no CDN:**
  ```
  cdn.kmiza27.com/
  ├── img/
  │   ├── escudos/           # Escudos dos times
  │   ├── logo-competition/  # Logos das competições
  │   └── players/           # Fotos dos jogadores (futuro)
  ```
- **Conversão Automática de URLs:**
  - `/uploads/escudos/botafogo.svg` → `https://cdn.kmiza27.com/img/escudos/botafogo.svg`
  - `/img/escudos/flamengo.png` → `https://cdn.kmiza27.com/img/escudos/flamengo.png`
- **Fallbacks:** Sistema automático de fallback para imagens não encontradas
- **Compatibilidade SSR:** Todas as funções CDN são compatíveis com Server-Side Rendering

## 7. Como Executar o Projeto

### 7.1. Desenvolvimento (Recomendado para IA)
- **Hot Reload Automático:** Em modo desenvolvimento, as mudanças são aplicadas automaticamente sem necessidade de build
- **Geral (Todos os Serviços):**
  - `npm run dev` (executa backend, admin e futepédia simultaneamente)
- **Serviços Individuais:**
  - **Backend:** `npm run dev:backend` (na raiz) ou `npm run start:dev` (em `backend/`) - Porta 3000
  - **Painel Administrativo:** `npm run dev:frontend` (na raiz) ou `npm run dev` (em `frontend/`) - Porta 3002
  - **Futepédia:** `npm run dev:futepedia` (na raiz) ou `npm run dev` (em `futepedia-frontend/`) - Porta 3003

### 7.2. Produção (Apenas quando necessário)
- **Build só é necessário para:**
  - ✅ **Deploy em produção**
  - ✅ **Testar versão otimizada**
  - ✅ **Gerar arquivos estáticos**
- **Comandos de Build:**
  - **Backend:** `npm run build` (em `backend/`)
  - **Frontend:** `npm run build` (em `frontend/`)
  - **Futepédia:** `npm run build` (em `futepedia-frontend/`)

### 7.3. Regra para IA: Evitar Builds Desnecessários
- **❌ NÃO fazer build** durante desenvolvimento
- **✅ Usar modo dev** que aplica mudanças automaticamente
- **✅ Hot reload** funciona instantaneamente
- **✅ Watch mode** reinicia servidores automaticamente

## 8. Funcionalidades do Chat Público
- **Widget Flutuante:** Disponível em todas as páginas da Futepédia
- **Página Dedicada:** `/futebot` - Interface completa do chat
- **Usuários Anônimos:** Sistema de UUID automático com persistência em localStorage
- **Menu Adaptativo:** Texto simples para site, botões interativos para WhatsApp
- **Monitoramento:** Usuários do site aparecem automaticamente no painel admin
- **Rastreamento de Origem:** Separação clara entre usuários do WhatsApp e do site
- **Integração Backend:** Endpoint `/chatbot/simulate-whatsapp` com parâmetro `origin`

## 9. Testes e Debugging
- **Teste do Chat Público:** Endpoint `/chatbot/simulate-whatsapp` com `origin: 'site'`
- **Exemplo de Teste:**
  ```bash
  curl -X POST http://localhost:3000/chatbot/simulate-whatsapp \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"site-123456","message":"oi","origin":"site"}'
  ```
- **Logs:** Sistema de logging detalhado para debug de mensagens e processamento
- **Status do Sistema:** Endpoint `/chatbot/status` para verificar saúde do sistema 

### 9.1. Detecção de Intenção com Sugestões ("Você quis dizer?")
- Objetivo: Reduzir respostas "não entendi" sugerindo ações reais do bot quando a confiança é baixa ou a intenção é desconhecida.
- Componentes:
  - `backend/src/chatbot/openai.service.ts`
    - Novo tipo `Suggestion { label, id?, intent?, confidence }`
    - Métodos novos: `similarity(a,b)` e `suggestAlternatives(message, menuItems)`
  - `backend/src/chatbot/chatbot.service.ts`
    - Ampliação no `processMessage`: quando `intent === 'unknown'` ou confiança < 0.6, gera sugestões.
    - Persistência de sugestões em `preferences.pendingSuggestions` e estado `conversationState = 'waiting_suggestion_choice'`.
    - Envio de lista interativa no WhatsApp via `scheduleSuggestionListSend` (título: "🤔 Você quis dizer?")
    - Aceita IDs `SUGGEST_INTENT_*` em `processButtonListId` (mapeia para ações padrão).
    - Novo case em `processConversationState`: `waiting_suggestion_choice` (usuário responde 1..N no site).
- Regras de UX por origem:
  - WhatsApp: resposta curta + envio de lista interativa com até 5 sugestões. Seleção chama diretamente a ação.
  - Site: resposta enumerada (1..N) e aguarda número. Ao receber, mapeia para ação.
- Fontes para sugestões:
  - Sinônimos de intenções principais (ex.: próximo jogo, jogos hoje, tabela, transmissão, artilheiros, elenco, posição, canais).
  - Itens do menu configurados em `whatsapp-menu` (reuso de `getMenuSections`).
- IDs e Prefixos:
  - Suporte a `SUGGEST_INTENT_` além de `CMD_`, `MENU_`, `COMP_`, `SCORERS_`, `STATS_`.
- Observações:
  - Mantém compatibilidade do backend; sem mudança de contrato com frontends.
  - Fácil extensão: adicionar sinônimos no `intentSynonyms` e/ou novos itens no menu.

## 10. Sistema de Simulação Monte Carlo e Estatísticas Preditivas

### 10.1. Visão Geral
Sistema robusto de previsões estatísticas para campeonatos usando simulação Monte Carlo, implementado para calcular probabilidades de título, rebaixamento e outras classificações.

### 10.2. Componentes Principais

#### Power Index (Índice de Força)
- **Localização:** `backend/src/modules/simulations/power-index.service.ts`
- **Função:** Calcular pontuação única (0-100) que mede a força real de cada time
- **Algoritmo:** Combinação ponderada de:
  - Points per Game (45%)
  - Goal Difference per Game (25%) 
  - Recent Form Score - últimos 5 jogos (30%)
- **Endpoint:** `calculatePowerIndexForCompetition(competitionId)`

#### Simulação Monte Carlo
- **Localização:** `backend/src/modules/simulations/monte-carlo.service.ts`
- **Função:** Simular milhares de cenários do restante da temporada
- **Algoritmo:** Para cada jogo restante, usa Power Index para prever probabilidades e simula resultados
- **Configurável:** 1 a 10.000 simulações por execução

#### Armazenamento Histórico
- **Tabela:** `simulation_results`
- **Estrutura:**
  ```sql
  - id (SERIAL PRIMARY KEY)
  - competition_id (INT, FK para competitions)
  - execution_date (TIMESTAMP)
  - simulation_count (INT 1-10000)
  - executed_by (VARCHAR(100))
  - is_latest (BOOLEAN) - apenas uma por competição
  - power_index_data (JSONB) - dados do Power Index
  - simulation_results (JSONB) - probabilidades calculadas
  - metadata (JSONB) - metadados da execução
  - execution_duration_ms (INT)
  - algorithm_version (VARCHAR(50))
  ```
- **Trigger Automático:** Garante que apenas uma simulação por competição seja marcada como `is_latest`

### 10.3. Controle Administrativo

#### Painel de Simulação
- **Localização Frontend:** `frontend/src/app/simulations/page.tsx`
- **Funcionalidades:**
  - Botão "Executar Nova Simulação"
  - Seletor de competição (Brasileirão Série A/B)
  - Campo para número de simulações (1-10.000)
  - Histórico de execuções anteriores

#### Endpoints da API
- **POST** `/simulations/run` - Executar nova simulação (admin apenas)
- **GET** `/teams/:id/advanced-stats` - Estatísticas unificadas do time
- **GET** `/teams/:id/title-chances` - Probabilidades de título (com fallback)
- **GET** `/teams/:id/relegation-risk` - Risco de rebaixamento (com fallback)

### 10.4. Migração Gradual
Sistema implementado com **migração gradual sem breaking changes**:
- **Endpoints Públicos:** Tentam buscar dados de simulação primeiro, fazem fallback para cálculo legacy se não encontrado
- **Compatibilidade:** Frontends funcionam com ou sem dados de simulação
- **Formato de Resposta:** Novo formato inclui flag `simulation_based` para identificar origem dos dados

### 10.5. Funcionalidades de Comparação

#### Comparação de Times
- **Localização:** `futepedia-frontend/src/components/TeamComparison.tsx`
- **Endpoint:** `GET /teams/:id/comparison/:otherTeamId`
- **Interface:** Sistema de busca + comparação lado a lado com gráficos

#### Predição de Partidas
- **Localização:** `futepedia-frontend/src/components/MatchPrediction.tsx`
- **Endpoint:** `GET /matches/:id/prediction`
- **Funcionalidades:**
  - Gráfico de 3 cores (Casa/Empate/Visitante)
  - Head-to-Head com estatísticas dos times
  - Fallback inteligente para dados indisponíveis
  - Aviso quando usa estatísticas gerais vs. competição específica

### 10.6. Escopo de Implementação
- **Competições:** Apenas Brasileirão Série A e Série B
- **Tipos de Simulação:** Título, rebaixamento, classificação para copas
- **Interface Admin:** Controle total sobre quando executar cálculos
- **Interface Pública:** Visualização das probabilidades e comparações

### 10.7. Fallbacks e Robustez
- **Power Index:** Fallback para estatísticas gerais se dados da competição indisponíveis
- **Predições:** Sistema inteligente degrada graciosamente quando dados específicos não existem
- **Avisos Visuais:** Frontend indica quando está usando dados de fallback
- **Compatibilidade:** Sistema funciona mesmo sem simulações executadas

### 10.8. Performance e Otimização
- **Índices de Banco:** Otimizados para consultas por competição e data
- **Cache Automático:** Reutilização de resultados via flag `is_latest`
- **Endpoint Unificado:** `/advanced-stats` retorna todos os dados em uma chamada
- **Cálculo Sob Demanda:** Simulações executadas apenas quando solicitado pelo admin

## 11. Sistema de Respostas Inteligentes de Competições - NOVA IMPLEMENTAÇÃO

### 11.1. Visão Geral
Sistema avançado de respostas para perguntas sobre competições, implementando:
- **Respostas completas** com informações essenciais
- **Próximos jogos** com canais de transmissão
- **Tabela de classificação** (top 5 + times em risco)
- **Sistema de confirmações** para mostrar mais detalhes
- **Links diretos** para páginas das competições

### 11.2. Componentes Principais

#### ChatbotService - Métodos de Competição
- **Localização:** `backend/src/chatbot/chatbot.service.ts`
- **Métodos Implementados:**
  - `getCompetitionInfo()`: Resposta completa da competição
  - `getCompetitionGames()`: Lista detalhada de jogos
  - `isConfirmationForCompetitionGames()`: Detecta confirmações
  - `getLastCompetitionMentioned()`: Contexto da conversa

#### Estrutura de Resposta de Competição
```typescript
// Resposta completa inclui:
🏆 NOME DA COMPETIÇÃO
📅 Temporada: 2025
📅 PRÓXIMOS JOGOS:
  📆 Data - Horário
  🆚 Time A vs Time B
  🏆 Fase/Rodada
  📺 Canais de transmissão

📊 TOP 5 DA TABELA:
  🥇 Time (pontos, gols pró/contra)

⚠️ TIMES EM RISCO:
  🔴 Time (pontos, gols pró/contra)

📅 PRÓXIMA RODADA: Nome da rodada

🔍 Quer saber mais sobre jogos específicos?
📱 Info completa: http://localhost:3001/[slug]/jogos
```

### 11.3. Sistema de Confirmações

#### Detecção de Confirmações
- **Padrões reconhecidos:** "sim", "yes", "claro", "quero", "queria", "gostaria"
- **Fluxo:** Usuário pergunta → Chatbot responde → Usuário confirma → Chatbot mostra mais detalhes

#### Implementação
```typescript
// Verificação de confirmação
if (this.isConfirmationForCompetitionGames(message)) {
  const competitionName = await this.getLastCompetitionMentioned(phoneNumber);
  if (competitionName) {
    const response = await this.getCompetitionGames(competitionName);
    return response;
  }
}
```

### 11.4. Otimização de Slugs

#### Uso de Slugs da Base de Dados
- **Campo:** `competition.slug` na tabela `competitions`
- **Características:** `VARCHAR(255) UNIQUE`
- **Interface Admin:** Campo editável no painel administrativo
- **Vantagens:** 
  - ✅ Sem geração desnecessária
  - ✅ URLs consistentes e configuráveis
  - ✅ Performance otimizada

#### Estrutura da Entidade
```typescript
@Entity('competitions')
export class Competition {
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;
  // ... outros campos
}
```

### 11.5. Sistema de Transmissões Integrado

#### Busca de Jogos com Transmissões
- **Query otimizada:** JOIN com `broadcasts` e `channels`
- **Informações retornadas:** Data, horário, times, fase, canais
- **Fallback:** Sistema funciona mesmo sem transmissões cadastradas

#### Exemplo de Query
```typescript
const upcomingMatches = await this.matchesRepository
  .createQueryBuilder('match')
  .leftJoinAndSelect('match.broadcasts', 'broadcasts')
  .leftJoinAndSelect('broadcasts.channel', 'channel')
  .where('comp.id = :competitionId', { competitionId: competition.id })
  .andWhere('match.match_date >= :today', { today: new Date() })
  .orderBy('match.match_date', 'ASC')
  .limit(5)
  .getMany();
```

### 11.6. Tabela de Classificação Inteligente

#### Top 5 + Times em Risco
- **Top 5:** Ordenados por pontos, gols pró, gols contra
- **Times em Risco:** Últimos 3 com indicadores visuais (🔴🟠🟡)
- **Dados:** Pontos, gols marcados, gols sofridos

#### Implementação
```typescript
// Top 5 da tabela
const topTeams = await this.competitionTeamsRepository
  .createQueryBuilder('ct')
  .orderBy('ct.points', 'DESC')
  .limit(5)
  .getMany();

// Times em risco (últimos 3)
const bottomTeams = await this.competitionTeamsRepository
  .createQueryBuilder('ct')
  .orderBy('ct.points', 'ASC')
  .limit(3)
  .getMany();
```

### 11.7. Integração com Query Adapter

#### Padrões de Detecção para Competições
- **Mapeamentos adicionados:**
```typescript
'brasileirao': 'competition_info',
'brasileiro': 'competition_info',
'copa do brasil': 'competition_info',
'libertadores': 'competition_info',
'sul-americana': 'competition_info',
'serie a': 'competition_info',
'serie b': 'competition_info'
```

#### Fluxo de Processamento
1. **Query Adapter** detecta padrão de competição
2. **ChatbotService** chama `getCompetitionInfo()`
3. **Resposta completa** é gerada com todas as informações
4. **Usuário confirma** para ver mais detalhes
5. **Sistema mostra** lista completa de jogos

### 11.8. Benefícios da Implementação

#### Para Usuários
- **✅ Respostas completas** em uma única pergunta
- **✅ Informações organizadas** e fáceis de entender
- **✅ Links diretos** para páginas das competições
- **✅ Fluxo natural** de confirmação para mais detalhes

#### Para Desenvolvedores
- **✅ Código limpo** e bem estruturado
- **✅ Reutilização** de métodos existentes
- **✅ Performance otimizada** com slugs da base
- **✅ Fácil manutenção** e extensão

#### Para Administradores
- **✅ Controle total** sobre slugs das competições
- **✅ URLs personalizáveis** via painel admin
- **✅ Consistência** em todo o sistema

### 11.9. Exemplos de Uso

#### Cenário 1: Pergunta sobre Competição
```
Usuário: "copa do brasil"
Chatbot: [Resposta completa com próximos jogos, tabela, etc.]
Usuário: "sim"
Chatbot: [Lista detalhada de todos os jogos]
```

#### Cenário 2: Diferentes Competições
```
Usuário: "brasileirao"
Chatbot: [Resposta completa do Brasileirão]

Usuário: "libertadores"
Chatbot: [Resposta completa da Libertadores]
```

### 11.10. Configuração e Manutenção

#### Painel Administrativo
- **Edição de Competições:** Campo "Slug" editável
- **Validação:** Slugs únicos automaticamente
- **Preview:** Visualização de URLs geradas

#### Banco de Dados
- **Tabela:** `competitions`
- **Campo crítico:** `slug` (UNIQUE)
- **Migrações:** Automáticas via TypeORM

#### Monitoramento
- **Logs:** Sistema de debug para respostas de competições
- **Métricas:** Contagem de perguntas por competição
- **Performance:** Tempo de resposta das queries