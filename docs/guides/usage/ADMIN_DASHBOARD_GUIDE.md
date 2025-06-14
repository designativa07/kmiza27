# 🎛️ Guia Completo do Dashboard Administrativo

Este documento é a fonte central de informações para o Dashboard Administrativo do Kmiza27, cobrindo desde o seu uso operacional até os detalhes técnicos para desenvolvedores.

---

## Parte 1: Guia do Usuário

Esta seção destina-se a administradores que utilizarão o painel para gerenciar o sistema.

### 1.1. Visão Geral e Acesso

O painel administrativo é uma interface web completa para gerenciar usuários, competições e visualizar estatísticas do chatbot.

#### **Como Acessar o Sistema:**
1.  **Inicie os serviços** (se em ambiente local): `npm run dev`
2.  **Abra o navegador** no endereço: `http://localhost:3002` (local) ou no domínio de produção do frontend.
3.  **Faça o login** com suas credenciais de administrador.
    - **Usuário Padrão (primeiro acesso):** `admin_kmiza27`
    - **Senha Padrão:** `admin@kmiza27`

Após o login, você será redirecionado para o dashboard principal.

### 1.2. Funcionalidades Principais

O painel é organizado em seções acessíveis pela barra lateral (sidebar).

#### **Dashboard (`/`)**
A página inicial apresenta um resumo do sistema:
- **Cards de Estatísticas**: Total de usuários, usuários ativos, usuários com time favorito e número de administradores.
- **Usuários Recentes**: Lista dos últimos 5 usuários cadastrados.

#### **Gerenciar Usuários (`/users`)**
Esta página permite o gerenciamento completo de todos os usuários do sistema.
- **Listagem e Busca**: Tabela completa com todos os usuários. Use o campo de busca para encontrar por nome, email ou telefone.
- **Filtros**: Refine a lista por status (ativo/inativo) ou por tipo (admin/usuário).
- **Ações**:
    - **Promover/Rebaixar Admin**: Altere o perfil de um usuário para administrador (ou vice-versa).
    - **Excluir Usuário**: Remova um usuário do sistema (ação requer confirmação).

#### **Gerenciar Administradores (`/admins`)**
Visualização focada apenas nos administradores.
- **Grid de Admins**: Exibe os administradores em formato de cards.
- **Criar Novo Admin**: Clique no botão "Criar Administrador" para abrir um formulário e adicionar um novo usuário com privilégios de administrador.

#### **Gerenciar Competições**
Permite vincular times a competições, formando tabelas e grupos.
1.  Na página de Competições, clique no ícone de "usuários" (👥) ao lado de uma competição.
2.  No modal que se abre, clique em **"Adicionar Times"**.
3.  Opcionalmente, defina um nome de grupo (ex: "Grupo A").
4.  Selecione os times desejados e clique em "Adicionar".
5.  Os times aparecerão na lista de participantes da competição. Você pode removê-los clicando no ícone de lixeira.

---

## Parte 2: Guia de Desenvolvimento

Esta seção é para desenvolvedores que precisam trabalhar no código-fonte do dashboard.

### 2.1. Arquitetura do Frontend

O dashboard é parte da aplicação Next.js (`/frontend`) e sua estrutura principal está em:
```
frontend/src/
├── app/
│   ├── (admin)/          # Agrupamento de rotas protegidas
│   │   ├── users/page.tsx
│   │   ├── admins/page.tsx
│   │   └── layout.tsx    # Layout com sidebar e header
│   └── login/page.tsx
├── components/
│   ├── layout/AdminLayout.tsx
│   └── dashboard/
├── contexts/AuthContext.tsx
└── services/api.ts
```

### 2.2. Design System e Componentes
- **Cores**: Definidas como variáveis CSS em `globals.css` (ex: `--primary`, `--secondary`).
- **Tipografia**: `Geist Sans` e `Geist Mono`.
- **Componentes Reutilizáveis**:
    - `Card`: Para exibir estatísticas.
    - `Table`: Para listagem de dados com paginação e filtros.
    - `Modal`: Para ações como criar e confirmar.
    - `ProtectedRoute`: High-Order Component (HOC) que protege as rotas que exigem autenticação.

### 2.3. Comandos
- **Instalação**: `npm install`
- **Desenvolvimento**: `npm run dev` (inicia o frontend na porta 3002)
- **Build**: `npm run build` (cria a versão de produção)

### 2.4. API Endpoints Relevantes
O frontend se comunica com a API do backend para todas as operações.
- `GET /api/stats/overview`: Pega os dados para os cards do dashboard.
- `GET /api/users`: Lista todos os usuários.
- `POST /api/users`: Cria um novo usuário.
- `PATCH /api/users/:id`: Atualiza um usuário (incluindo promoção/rebaixamento).
- `DELETE /api/users/:id`: Exclui um usuário.
- `POST /competitions/:id/teams`: Adiciona times a uma competição.

### 2.5. Autenticação e Segurança
- A autenticação é gerenciada pelo `AuthContext`, que armazena o token JWT no `localStorage`.
- Um interceptor do `axios` injeta automaticamente o token `Bearer` em todas as requisições para a API.
- As rotas do admin são envolvidas pelo componente `ProtectedRoute` para garantir que apenas usuários autenticados possam acessá-las. 