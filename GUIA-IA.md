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
- **Autenticação e Autorização:** A autenticação é baseada em JSON Web Tokens (JWT). O serviço `AuthService` (`src/modules/auth/auth.service.ts`) gerencia a validação de usuários e a geração de tokens. A autorização é implementada através de guards do NestJS em rotas protegidas.
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

## 4. Frontend - Futepédia (`/futepedia-frontend`)
- **Finalidade:** Interface pública para que os usuários possam visualizar informações de campeonatos, como tabelas de classificação e listas de jogos.
- **Tecnologias Principais:**
  - **Framework:** Next.js (com App Router)
  - **Linguagem:** TypeScript
  - **UI:** React, Tailwind CSS, Lucide React
- **Estrutura de Diretórios Crítica:**
  - `src/app`: Estrutura de roteamento principal, incluindo rotas dinâmicas como `[competitionSlug]/classificacao`.
  - `src/app/[competitionSlug]/layout.tsx`: Layout compartilhado para páginas de uma mesma competição.
  - `src/lib/cdn-simple.ts`: Biblioteca simplificada para gerenciar URLs do CDN, compatível com SSR.
  - `src/lib/cdn.ts`: Utilitários completos do CDN com funções específicas para diferentes tipos de imagem.
- **Renderização:** Primarily Server-Side Rendering (SSR) para garantir que os dados mais recentes sejam sempre exibidos e para otimização de SEO.
- **CDN Integration:** Integração completa com CDN `https://cdn.kmiza27.com`. Inclui conversão automática de URLs antigas, fallbacks para imagens não encontradas, e compatibilidade total com SSR.

## 5. Banco de Dados
- **Tipo:** PostgreSQL, conforme definido em `backend/src/data-source.ts`.
- **Schema/ORM:** O schema é gerenciado pelo TypeORM. As definições das entidades estão localizadas em `backend/src/entities` e as migrações em `backend/src/migrations`.

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