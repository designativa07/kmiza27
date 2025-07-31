# 🎮 GUIA DE IMPLEMENTAÇÃO - JOGO DE FUTEBOL KMIZA27

## 📋 VISÃO GERAL DO PROJETO

### **Objetivo**
Criar um jogo de administração de futebol estilo Elifoot, integrado ao ecossistema Kmiza27, com:
- Criação de times personalizados
- Sistema de categorias de base com peneiras
- Simulação visual de partidas
- Integração com dados reais do sistema principal

### **Arquitetura**
- **Backend:** NestJS + Supabase (serviço isolado)
- **Frontend:** Next.js + Supabase Client
- **Database:** PostgreSQL via Supabase local
- **Deploy:** EasyPanel (VPS)

## 🏗️ INFRAESTRUTURA

### **URLs e Configurações**
```bash
# Supabase Local
SUPABASE_URL=https://kmiza27-supabase.h4xd66.easypanel.host/
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# Sistema Principal
MAIN_API_URL=http://195.200.0.191:3001
```

### **Estrutura de Diretórios**
```
kmiza27/
├── kmiza27-game/                    # Novo serviço do jogo
│   ├── backend/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── game-teams/
│   │   │   │   ├── youth-academy/
│   │   │   │   ├── simulation/
│   │   │   │   └── real-time/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   └── utils/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── docker/
│       └── easypanel-game.yml
└── docker/
    └── easypanel-game.yml          # Configuração EasyPanel
```

## 🗄️ SCHEMA DO BANCO DE DADOS

### **Tabelas Principais**

#### **1. game_users**
```sql
CREATE TABLE game_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  game_stats JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. game_teams**
```sql
CREATE TABLE game_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_name VARCHAR(50),
  owner_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
  team_type VARCHAR(20) DEFAULT 'user_created',
  real_team_id INTEGER,
  
  -- Visual
  colors JSONB DEFAULT '{}',
  logo_url TEXT,
  stadium_name VARCHAR(255),
  stadium_capacity INTEGER DEFAULT 10000,
  
  -- Game Stats
  budget DECIMAL(12,2) DEFAULT 1000000,
  reputation INTEGER DEFAULT 50,
  fan_base INTEGER DEFAULT 5000,
  game_stats JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. youth_categories**
```sql
CREATE TABLE youth_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **4. youth_academies**
```sql
CREATE TABLE youth_academies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  
  facilities JSONB DEFAULT '{
    "training_fields": 1,
    "gym_quality": 1,
    "medical_center": 1,
    "dormitory_capacity": 10,
    "coaching_staff": 2
  }',
  
  investment DECIMAL(12,2) DEFAULT 0,
  monthly_cost DECIMAL(10,2) DEFAULT 50000,
  efficiency_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **5. youth_players**
```sql
CREATE TABLE youth_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100) DEFAULT 'Brasil',
  
  team_id UUID REFERENCES game_teams(id) ON DELETE SET NULL,
  category_id UUID REFERENCES youth_categories(id),
  
  attributes JSONB NOT NULL,
  potential JSONB NOT NULL,
  
  status VARCHAR(50) DEFAULT 'available',
  scouted_date DATE,
  contract_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **6. youth_tryouts**
```sql
CREATE TABLE youth_tryouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
  category_id UUID REFERENCES youth_categories(id),
  
  tryout_type VARCHAR(50) NOT NULL,
  tryout_date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  participants_count INTEGER DEFAULT 50,
  
  status VARCHAR(50) DEFAULT 'scheduled',
  results JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **7. game_matches**
```sql
CREATE TABLE game_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_team_id UUID REFERENCES game_teams(id),
  away_team_id UUID REFERENCES game_teams(id),
  
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  
  simulation_data JSONB,
  highlights JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 IMPLEMENTAÇÃO POR FASES

### **FASE 1: SETUP BÁSICO (1-2 dias)**

#### **1.1 Criar Estrutura do Projeto**
```bash
# Na raiz do kmiza27
mkdir kmiza27-game
cd kmiza27-game

# Backend
mkdir -p backend/src/{modules,config,database,utils}
mkdir -p backend/src/modules/{auth,game-teams,youth-academy,simulation}

# Frontend
mkdir -p frontend/src/{app,components,lib,types}
```

#### **1.2 Configurar Supabase**
- Acessar https://kmiza27-supabase.h4xd66.easypanel.host/
- Executar SQL do schema
- Configurar RLS (Row Level Security)

#### **1.3 Setup Backend Básico**
- NestJS + Supabase
- Configuração de ambiente
- Serviços base

#### **1.4 Setup Frontend Básico**
- Next.js + Supabase Client
- Autenticação básica
- Interface inicial

### **FASE 2: CORE FEATURES (3-5 dias)**

#### **2.1 Sistema de Times**
- Criação de times personalizados
- Editor de escudos
- Gestão de orçamento

#### **2.2 Academia de Base**
- Níveis de academia
- Desenvolvimento de jogadores
- Sistema de peneiras

#### **2.3 Simulação Básica**
- Motor de simulação simples
- Visualização de resultados
- Estatísticas básicas

### **FASE 3: INTEGRAÇÃO (2-3 dias)**

#### **3.1 Sincronização com Sistema Principal**
- Importar times reais
- Sincronizar dados básicos
- Manter consistência

#### **3.2 Deploy EasyPanel**
- Configurar containers
- Setup de rede
- Health checks

### **FASE 4: POLISH (2-3 dias)**

#### **4.1 UI/UX**
- Interface responsiva
- Animações
- Feedback visual

#### **4.2 Performance**
- Otimizações
- Cache
- Lazy loading

## 🎯 FUNCIONALIDADES PRIORITÁRIAS

### **MVP (Minimum Viable Product)**
1. ✅ **Criação de times personalizados**
2. ✅ **Sistema de academia básico**
3. ✅ **Peneiras simples**
4. ✅ **Simulação básica de partidas**
5. ✅ **Interface web funcional**

### **V2 (Segunda Versão)**
1. 🔄 **Simulação visual avançada**
2. 🔄 **Sistema de transferências**
3. 🔄 **Competições entre times criados**
4. 🔄 **Integração WhatsApp**

### **V3 (Versão Completa)**
1. 🔮 **3D opcional**
2. 🔮 **IA para simulação**
3. 🔮 **Sistema de legado**
4. 🔮 **Monetização**

## 🛠️ TECNOLOGIAS E FERRAMENTAS

### **Backend**
- **Framework:** NestJS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Language:** TypeScript

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + Shadcn/ui
- **State:** Zustand
- **Charts:** Recharts
- **Animations:** Framer Motion

### **DevOps**
- **Container:** Docker
- **Orchestration:** EasyPanel
- **Monitoring:** Built-in health checks
- **CI/CD:** GitHub Actions (opcional)

## 📊 MÉTRICAS DE SUCESSO

### **Técnicas**
- ✅ **Zero interferência** no sistema principal
- ✅ **Deploy isolado** e independente
- ✅ **Performance** < 2s load time
- ✅ **Uptime** > 99.5%

### **Funcionais**
- ✅ **Usabilidade** intuitiva
- ✅ **Engajamento** > 5 min/sessão
- ✅ **Retenção** > 30% após 7 dias
- ✅ **Feedback** positivo dos usuários

## 🚀 COMANDOS DE DEPLOY

### **Desenvolvimento**
```bash
# Backend
cd kmiza27-game/backend
npm install
npm run start:dev

# Frontend
cd kmiza27-game/frontend
npm install
npm run dev
```

### **Produção**
```bash
# Build e deploy
docker-compose -f docker/easypanel-game.yml up -d

# Logs
docker-compose -f docker/easypanel-game.yml logs -f
```

## 🔍 MONITORAMENTO

### **Health Checks**
- Backend: `http://localhost:3004/health`
- Frontend: `http://localhost:3005/api/health`
- Supabase: Dashboard interno

### **Logs**
- EasyPanel logs
- Docker logs
- Supabase logs

## 📝 PRÓXIMOS PASSOS

1. **Executar SQL** no Supabase Studio
2. **Criar estrutura** de arquivos
3. **Implementar backend** básico
4. **Implementar frontend** básico
5. **Testar integração** com Supabase
6. **Deploy** no EasyPanel

---

**Status:** 📋 Planejado
**Prioridade:** 🔥 Alta
**Estimativa:** 10-15 dias
**Responsável:** IA Assistant + Desenvolvedor 