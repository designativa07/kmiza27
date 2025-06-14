# 🐳 Configuração Docker do Kmiza27

Este diretório contém todos os arquivos necessários para containerização e deploy do projeto Kmiza27.

## 📋 Arquivos

- `Dockerfile.backend` - Configuração do container do backend (NestJS)
- `Dockerfile.frontend` - Configuração do container do frontend (Next.js)
- `docker-compose.yml` - Orquestração dos containers
- `.dockerignore` - Arquivos e diretórios ignorados no build

## 🚀 Uso

### Desenvolvimento Local

```bash
# Construir e iniciar os containers
docker-compose up --build

# Iniciar em background
docker-compose up -d

# Parar os containers
docker-compose down
```

### Produção

```bash
# Construir para produção
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Iniciar em background
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔧 Portas

- Frontend: 3002
- Backend: 3000
- PostgreSQL: 5433

## 📦 Variáveis de Ambiente

As variáveis de ambiente necessárias estão definidas no arquivo `docker-compose.yml`. Para desenvolvimento local, você pode criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Backend
DATABASE_HOST=postgres
DATABASE_PORT=5433
DATABASE_USERNAME=kmiza27
DATABASE_PASSWORD=kmiza27_password
DATABASE_NAME=kmiza27_db
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=24h

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🔐 Segurança

- As senhas e secrets devem ser gerenciados através de variáveis de ambiente
- O PostgreSQL está configurado com usuário e senha específicos
- As portas expostas são limitadas ao necessário
- O .dockerignore exclui arquivos sensíveis do build 