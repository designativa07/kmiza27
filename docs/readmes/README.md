# 🤖⚽ Kmiza27 ChatBot

[![Next.js](https://img.shields.io/badge/Next.js-15.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Sobre o Projeto

O Kmiza27 é um chatbot especializado em futebol que oferece informações em tempo real sobre jogos, estatísticas de times e jogadores. O sistema inclui um dashboard administrativo completo para gerenciamento de usuários e administradores.

## 🚀 Tecnologias Principais

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeORM, JWT
- **Database**: PostgreSQL 15
- **Deploy**: Docker, Easypanel

## 🏗️ Estrutura do Projeto

```
kmiza27/
├── frontend/          # Aplicação Next.js
├── backend/           # API NestJS
├── database/          # Scripts e migrações do banco
├── scripts/           # Scripts de utilidade
└── docker/            # Configurações Docker
```

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/designativa07/kmiza27.git
cd kmiza27
```

2. Instale as dependências:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

3. Configure as variáveis de ambiente:
```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=seu_usuario
DATABASE_PASSWORD=sua_senha
DATABASE_NAME=kmiza27_db
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=24h
```

4. Execute as migrações:
```bash
cd backend
npm run migration:run
```

5. Inicie o projeto:
```bash
npm run dev
```

## 📦 Deploy

O projeto está configurado para deploy no Easypanel com Docker:

1. Backend (Porta 3000)
2. Frontend (Porta 3002)
3. PostgreSQL (Porta 5433)

## 🔐 Segurança

- Autenticação JWT
- Hash de senhas com bcrypt
- Validação de inputs
- Proteção de rotas
- Headers de segurança

## 📚 Documentação

- [Guia de Autenticação](./docs/AUTENTICACAO.md)
- [Manual do Dashboard](./docs/DASHBOARD.md)
- [Guia de Deploy](./docs/DEPLOY.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 