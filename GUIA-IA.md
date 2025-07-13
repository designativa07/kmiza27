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
- **CDN e Upload de Arquivos:**
  - **CDN Oficial:** `https://cdn.kmiza27.com` - Todas as URLs de imagem são automaticamente convertidas para CDN via interceptador global.
  - **MinIO Storage:** Integração com MinIO (S3-compatible) hospedado no EasyPanel para armazenamento de arquivos.
  - **Upload Service:** `src/modules/upload/upload-cloud.service.ts` gerencia URLs do CDN e MinIO.
  - **Conversão Automática:** Interceptador global converte URLs antigas (`/uploads/escudos/`) para CDN (`https://cdn.kmiza27.com/img/escudos/`).
- **Testes:** Utiliza-se Jest para testes unitários e de integração. Os scripts de teste estão definidos no `package.json` do backend.

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
- **Geral (Todos os Serviços):**
  - `npm run dev` (executa backend, admin e futepédia simultaneamente)
- **Serviços Individuais:**
  - **Backend:** `npm run dev:backend` (na raiz) ou `npm run start:dev` (em `backend/`) - Porta 3000
  - **Painel Administrativo:** `npm run dev:frontend` (na raiz) ou `npm run dev` (em `frontend/`) - Porta 3002
  - **Futepédia:** `npm run dev:futepedia` (na raiz) ou `npm run dev` (em `futepedia-frontend/`) - Porta 3003

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