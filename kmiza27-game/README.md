# 🎮 Jogo de Futebol Kmiza27

Um jogo de administração de futebol estilo Elifoot, integrado ao ecossistema Kmiza27.

## 🏗️ Arquitetura

- **Backend:** NestJS + Supabase
- **Frontend:** Next.js + Supabase Client  
- **Database:** PostgreSQL via Supabase local
- **Deploy:** EasyPanel (VPS)

## 🚀 Início Rápido

### Pré-requisitos

1. **Supabase configurado** em https://kmiza27-supabase.h4xd66.easypanel.host/
2. **SQL executado** (ver `database/schema.sql`)
3. **Node.js 18+** instalado
4. **Docker** instalado

### Desenvolvimento

```bash
# Instalar dependências do backend
cd backend
npm install

# Executar em modo desenvolvimento
npm run start:dev

# Em outro terminal, instalar dependências do frontend
cd ../frontend
npm install

# Executar frontend
npm run dev
```

### Produção

```bash
# Deploy completo
./deploy-game.sh

# Ou manualmente:
docker-compose -f docker/easypanel-game.yml up -d
```

## 📊 URLs

- **Backend:** http://localhost:3004
- **Frontend:** http://localhost:3005  
- **Health Check:** http://localhost:3004/api/v1/health
- **Supabase:** https://kmiza27-supabase.h4xd66.easypanel.host/

## 🗄️ Banco de Dados

### Executar Schema

1. Acesse https://kmiza27-supabase.h4xd66.easypanel.host/
2. Vá para SQL Editor
3. Execute o conteúdo de `database/schema.sql`

### Tabelas Principais

- `game_users` - Usuários do jogo
- `game_teams` - Times (reais + criados)
- `youth_categories` - Categorias de base
- `youth_academies` - Academias de base
- `youth_players` - Jogadores jovens
- `youth_tryouts` - Peneiras
- `game_matches` - Partidas do jogo

## 🎯 Funcionalidades

### MVP (Implementado)
- ✅ Criação de times personalizados
- ✅ Sistema de academia básico
- ✅ Peneiras simples
- ✅ Gestão de orçamento

### V2 (Próximas)
- 🔄 Simulação visual avançada
- 🔄 Sistema de transferências
- 🔄 Competições entre times
- 🔄 Integração WhatsApp

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
kmiza27-game/
├── backend/                 # NestJS + Supabase
│   ├── src/
│   │   ├── modules/        # Módulos da aplicação
│   │   ├── config/         # Configurações
│   │   ├── database/       # Serviços do banco
│   │   └── utils/          # Utilitários
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Next.js + Supabase Client
│   ├── src/
│   │   ├── app/           # Páginas (App Router)
│   │   ├── components/    # Componentes React
│   │   ├── lib/          # Bibliotecas
│   │   └── types/        # Tipos TypeScript
│   ├── Dockerfile
│   └── package.json
├── docker/
│   └── easypanel-game.yml # Configuração EasyPanel
└── database/
    └── schema.sql         # Schema do banco
```

### Comandos Úteis

```bash
# Backend
cd backend
npm run start:dev          # Desenvolvimento
npm run build              # Build
npm run test               # Testes

# Frontend  
cd frontend
npm run dev                # Desenvolvimento
npm run build              # Build
npm run test               # Testes

# Docker
docker-compose -f docker/easypanel-game.yml up -d    # Deploy
docker-compose -f docker/easypanel-game.yml logs -f  # Logs
docker-compose -f docker/easypanel-game.yml down     # Parar
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Backend (.env)
SUPABASE_URL=https://kmiza27-supabase.h4xd66.easypanel.host/
SUPABASE_SERVICE_KEY=your-service-key
MAIN_API_URL=http://195.200.0.191:3001
PORT=3004

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://kmiza27-supabase.h4xd66.easypanel.host/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GAME_API_URL=http://localhost:3004
```

## 📝 API Endpoints

### Times do Jogo

- `POST /api/v1/game-teams` - Criar time
- `GET /api/v1/game-teams` - Listar times do usuário
- `GET /api/v1/game-teams/:id` - Buscar time por ID
- `PUT /api/v1/game-teams/:id` - Atualizar time
- `DELETE /api/v1/game-teams/:id` - Deletar time
- `GET /api/v1/game-teams/:id/stats` - Estatísticas do time
- `POST /api/v1/game-teams/:id/budget` - Atualizar orçamento

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Supabase**
   - Verificar URL e chaves
   - Verificar se o Supabase está rodando

2. **Erro de build**
   - Limpar cache: `npm run build -- --clean`
   - Verificar dependências: `npm install`

3. **Erro de deploy**
   - Verificar logs: `docker-compose logs`
   - Verificar rede: `docker network ls`

## 📞 Suporte

- **Issues:** GitHub Issues
- **Documentação:** Este README
- **Guia Completo:** `GAME_IMPLEMENTATION_GUIDE.md`

---

**Status:** 🚧 Em Desenvolvimento
**Versão:** 1.0.0
**Última Atualização:** 2025-01-31 