# 🤖⚽ Kmiza27 ChatBot - Sistema Administrativo Completo

[![Next.js](https://img.shields.io/badge/Next.js-15.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

> **ChatBot inteligente de futebol com dashboard administrativo moderno e sistema de autenticação completo.**

## 🎯 **Sobre o Projeto**

O **Kmiza27** é um chatbot especializado em futebol que oferece informações em tempo real sobre jogos, estatísticas de times e jogadores. O sistema inclui um **dashboard administrativo completo** para gerenciamento de usuários e administradores.

### ✨ **Principais Funcionalidades**

- 🤖 **ChatBot Inteligente** - Respostas automáticas sobre futebol
- 🔐 **Sistema de Autenticação** - Login seguro com JWT
- 📊 **Dashboard Administrativo** - Interface moderna para gestão
- 👥 **Gerenciamento de Usuários** - CRUD completo com filtros
- 🛡️ **Controle de Administradores** - Criação e gestão de admins
- 📱 **Interface Responsiva** - Design mobile-first
- ⚡ **Tempo Real** - Estatísticas atualizadas automaticamente

## 🏗️ **Arquitetura do Sistema**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │◄──►│    Backend      │◄──►│   PostgreSQL    │
│   (Next.js)     │    │   (NestJS)      │    │   Database      │
│   Port: 3002    │    │   Port: 3000    │    │   Port: 5433    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 **Stack Tecnológica**

#### **Frontend**
- **Next.js 15** - Framework React com SSR
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Heroicons** - Biblioteca de ícones
- **Axios** - Cliente HTTP

#### **Backend**
- **NestJS** - Framework Node.js escalável
- **TypeORM** - ORM para TypeScript
- **JWT** - Autenticação por tokens
- **bcrypt** - Hash de senhas
- **Class Validator** - Validação de dados

#### **Banco de Dados**
- **PostgreSQL** - Banco relacional
- **TypeORM Migrations** - Controle de versão do DB

## 🚀 **Instalação e Configuração**

### **Pré-requisitos**
- Node.js 18+ 
- PostgreSQL 15+
- npm ou yarn

### **1. Clone o Repositório**
```bash
git clone https://github.com/designativa07/kmiza27.git
cd kmiza27
```

### **2. Instale as Dependências**
```bash
# Instalar dependências do projeto
npm install

# Instalar dependências do backend
cd backend && npm install

# Instalar dependências do frontend
cd ../frontend && npm install
```

### **3. Configuração do Banco de Dados**

Crie um banco PostgreSQL e configure as variáveis de ambiente:

```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=seu_usuario
DATABASE_PASSWORD=sua_senha
DATABASE_NAME=kmiza27_db

JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h
```

### **4. Execute as Migrações**
```bash
cd backend
npm run migration:run
```

### **5. Inicie os Serviços**
```bash
# No diretório raiz
npm run dev
```

Isso iniciará:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:3002

## 🎛️ **Dashboard Administrativo**

### **Acesso ao Sistema**
1. Acesse: `http://localhost:3002`
2. Faça login com as credenciais:
   - **Usuário**: `admin_kmiza27`
   - **Senha**: `admin@kmiza27`

### **Funcionalidades Disponíveis**

#### 📊 **Dashboard Principal**
- Cards de estatísticas em tempo real
- Lista de usuários recentes
- Ações rápidas para navegação
- Métricas de engajamento

#### 👥 **Gerenciamento de Usuários**
- Listagem completa com paginação
- Filtros por status (ativo/inativo)
- Busca por nome, email ou telefone
- Promoção/rebaixamento de administradores
- Exclusão de usuários com confirmação

#### 🛡️ **Administradores**
- Visualização em grid de cards
- Criação de novos administradores
- Formulário com validação completa
- Gestão de permissões

## 📱 **Interface e Design**

### **Design System**
- **Cores**: Gradientes azul/roxo e laranja/vermelho
- **Tipografia**: Geist Sans
- **Ícones**: Heroicons
- **Responsividade**: Mobile-first
- **Estados**: Loading, erro, sucesso, vazio

### **Componentes Principais**
- `AdminLayout` - Layout com sidebar e header
- `StatsCard` - Cards de estatísticas coloridos
- `ProtectedRoute` - Proteção de rotas
- `LoadingSpinner` - Estados de carregamento

## 🛡️ **Segurança**

### **Autenticação**
- ✅ JWT com expiração de 24h
- ✅ Verificação automática de tokens
- ✅ Proteção de todas as rotas
- ✅ Logout com limpeza de dados

### **Autorização**
- ✅ Controle de acesso por roles
- ✅ Middleware de autenticação
- ✅ Validação de permissões

### **Dados**
- ✅ Hash de senhas com bcrypt
- ✅ Validação de inputs
- ✅ Sanitização de dados
- ✅ Headers de segurança

## 📦 **Deploy**

### **Easypanel (Recomendado)**

O sistema está otimizado para deploy no Easypanel com apenas **2 aplicações**:

#### **1. Backend (kmiza27-backend)**
```dockerfile
# Usar Dockerfile existente
PORT: 3000
ENV: production
```

#### **2. Frontend (kmiza27-frontend)**
```dockerfile
# Build Next.js
PORT: 3002
ENV: production
NEXT_PUBLIC_API_URL: https://api.seudominio.com
```

### **Variáveis de Ambiente**

#### **Backend**
```env
DATABASE_HOST=seu_host_postgres
DATABASE_PORT=5432
DATABASE_USERNAME=usuario
DATABASE_PASSWORD=senha
DATABASE_NAME=kmiza27_prod
JWT_SECRET=jwt_secret_producao
NODE_ENV=production
```

#### **Frontend**
```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXT_PUBLIC_APP_NAME=Kmiza27 ChatBot
NODE_ENV=production
```

## 🧪 **Testes**

### **Executar Testes**
```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

### **Testes de Integração**
```bash
# Testar autenticação
npm run test:auth

# Testar API
npm run test:api
```

## 📚 **Documentação**

- 📖 [**Guia de Autenticação**](./AUTENTICACAO_ADMIN.md)
- 🎛️ [**Dashboard Completo**](./DASHBOARD_ADMINISTRATIVO_COMPLETO.md)
- 🔄 [**Migração Frontend**](./MIGRACAO_FRONTEND_AUTH.md)
- 🚀 [**Deploy Easypanel**](./DEPLOY_ADMIN_EASYPANEL.md)

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 **Autor**

**Designativa07**
- GitHub: [@designativa07](https://github.com/designativa07)
- Projeto: [Kmiza27](https://github.com/designativa07/kmiza27)

---

## 🎉 **Status do Projeto**

✅ **Sistema de Autenticação**: Completo  
✅ **Dashboard Administrativo**: Completo  
✅ **Gerenciamento de Usuários**: Completo  
✅ **Interface Responsiva**: Completo  
✅ **Deploy Ready**: Pronto para produção  

**O Kmiza27 está pronto para uso em produção!** 🚀⚽ #   D e p l o y   t r i g g e r  
 