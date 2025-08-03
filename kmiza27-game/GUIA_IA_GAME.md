# 🎮 GUIA IA GAME - kmiza27-game (**REFORMULADO**)

## 📋 **VISÃO GERAL DO PROJETO**

Este é um jogo de futebol gerenciador **inspirado no clássico Elifoot** onde usuários criam times, participam de competições hierárquicas e gerenciam suas equipes. O projeto usa NestJS (backend), Next.js (frontend) e Supabase (banco de dados).

**🔄 REFORMULAÇÃO:** Sistema simplificado com foco na experiência do usuário, similar ao Elifoot clássico.

---

## 🏗️ **ARQUITETURA REFORMULADA**

### **Conceito Central**
- **20 times por série** (sempre fixo)
- **19 times da máquina + 1 usuário** por série
- **Times da máquina são padrão** para todos os jogadores
- **Times da máquina NÃO evoluem** (arquitectura simples)
- **Usuário só vê sua série atual**

### **Estrutura de Diretórios**
```
kmiza27-game/
├── backend/                 # API NestJS reformulada
│   ├── src/
│   │   ├── modules/        # Módulos simplificados
│   │   │   ├── game-teams/ # Criação de times
│   │   │   ├── competitions/ # Série atual do usuário
│   │   │   ├── machine-teams/ # Times da máquina (NOVO)
│   │   │   └── seasons/ # Temporadas (NOVO)
│   │   ├── config/         # Configurações
│   │   └── database/       # Schema reformulado
│   ├── scripts/            # Scripts de migração
│   └── database/           # Schema simplificado
├── frontend/               # Interface reformulada
│   ├── src/
│   │   ├── components/     # Foco na série atual
│   │   ├── services/       # APIs simplificadas
│   │   └── store/          # Estado simplificado
└── docs/                   # Documentação atualizada
```

### **Tecnologias Principais**
- **Backend**: NestJS + TypeScript (reformulado)
- **Frontend**: Next.js + React + TypeScript (simplificado)
- **Banco**: Supabase (schema novo)
- **Estado**: Zustand (dados mínimos)
- **UI**: Tailwind CSS (focada no essencial)

---

## 🗄️ **BANCO DE DADOS REFORMULADO**

### **Tabelas Principais (Simplificadas)**

#### **1. Times Fixos da Máquina**
```sql
-- Times que nunca mudam, são padrão para todos
game_machine_teams (
  id, name, tier, attributes, stadium_name, colors
)
```

#### **2. Progresso do Usuário**
```sql
-- Posição atual do usuário no jogo
game_user_competition_progress (
  user_id, team_id, current_tier, position, 
  points, wins, draws, losses, goals_for, goals_against
)
```

#### **3. Partidas da Temporada**
```sql
-- Todas as partidas da série atual do usuário
game_season_matches (
  user_id, tier, round_number, 
  home_team_id, away_team_id, 
  home_machine_team_id, away_machine_team_id,
  home_score, away_score, status
)
```

#### **4. Competições Fixas**
```sql
-- Estrutura das 4 séries (A, B, C, D)
game_competitions_fixed (
  name, tier, promotion_spots, relegation_spots
)
```

### **Conexão com Supabase**
```javascript
// SEMPRE usar o arquivo centralizado (mantido)
const { getSupabaseClient } = require('./config/supabase-connection');
const supabase = getSupabaseClient('vps');
```

### **Times da Máquina por Série**

#### **Série D (Entrada - 19 times fixos):**
```
Atlético Brasiliense, Real DF, Gama FC, Vila Nova GO,
Aparecidense, Brasiliense FC, Ceilândia EC, Sobradinho EC,
Luziânia EC, Formosa EC, Anápolis FC, Cristalina FC,
Planaltina EC, Valparaíso FC, Águas Lindas FC, Novo Gama FC,
Santo Antônio EC, Alexânia FC, Goianésia EC
```

#### **Série C (19 times fixos):**
```
Guarani SP, Ponte Preta, Ituano, Mirassol, Novorizontino,
Botafogo SP, Portuguesa, Santo André, São José SP,
Vila Nova GO, Goiás, Atlético GO, Tombense, Caldense,
América MG, Villa Nova MG, URT, Patrocinense, Athletic Club
```

#### **Série B (19 times fixos):**
```
Santos, Guarani, Ponte Preta, Novorizontino, Mirassol,
Sport, Náutico, Vila Nova, Goiás, Coritiba, Avaí,
Chapecoense, Londrina, Operário PR, CRB, CSA,
Botafogo PB, Sampaio Corrêa, Paysandu
```

#### **Série A (Elite - 19 times fixos):**
```
Flamengo, Palmeiras, São Paulo, Corinthians, Santos,
Grêmio, Internacional, Atlético MG, Cruzeiro, Botafogo,
Fluminense, Vasco, Fortaleza, Ceará, Bahia, Vitória,
Athletico PR, Coritiba, Cuiabá
```

---

## 🎯 **FUNCIONALIDADES REFORMULADAS**

### **1. Sistema de Times (Simplificado)**
- ✅ Criação automática de 23 jogadores por time
- ✅ Inscrição **automática na Série D**
- ✅ **19 times da máquina já existem** (padrão)
- ✅ **Calendário criado automaticamente**
- ✅ **Pronto para jogar imediatamente**

### **2. Sistema de Competições (Reformulado)**
- ✅ **Série D**: Entrada obrigatória
- ✅ **Promoção**: 4 primeiros sobem de série
- ✅ **Rebaixamento**: 4 últimos descem de série
- ✅ **Invisibilidade**: Usuário só vê sua série
- ✅ **Progressão clara**: Subir até a Série A

### **3. Sistema de Jogadores (Mantido)**
- ✅ 23 jogadores por time nas mesmas posições
- ✅ Atributos realistas por posição
- ✅ Sistema de potencial de evolução

### **4. Times da Máquina (NOVO)**
- ✅ **19 times fixos** por série
- ✅ **Atributos constantes** (não evoluem)
- ✅ **Nomes realistas** por série
- ✅ **Comportamento previsível** na simulação

---

## ⚙️ **CONFIGURAÇÕES DE AMBIENTE**

### **Ambientes (Mantidos)**
- **VPS (Produção)**: `https://kmiza27-supabase.h4xd66.easypanel.host`
- **Local (Dev)**: `http://localhost:54321`

### **Chaves de Acesso (Mantidas)**
```javascript
// VPS - Anon Key (mantida)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

// VPS - Service Key (mantida)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
```

---

## 🚀 **COMANDOS REFORMULADOS**

### **Backend**
```bash
# Reformular sistema de competições
npm run reform-competitions

# Popular times da máquina fixos
npm run populate-machine-teams

# Testar novo sistema
npm run test-reformed-system

# Desenvolvimento normal
npm run start:dev
```

### **Frontend**
```bash
# Rebuild com nova UI simplificada
npm run rebuild-ui

# Testar fluxo do usuário
npm run test-user-flow

# Desenvolvimento normal
npm run dev
```

---

## 🔧 **REGRAS DE DESENVOLVIMENTO REFORMULADAS**

### **1. Comandos no Windows (Mantido)**
```bash
# ✅ CORRETO (funciona no Windows)
cd backend; npm run reform-competitions
```

### **2. Conexão com Supabase (Mantido)**
```javascript
// ✅ CORRETO - sempre usar centralizado
const { getSupabaseClient } = require('./config/supabase-connection');
```

### **3. Nova Estrutura de Dados**
```javascript
// ✅ CORRETO - focar na série atual do usuário
const userCurrentTier = await getUserCurrentTier(userId);
const machineTeams = await getMachineTeamsByTier(userCurrentTier);
const userMatches = await getUserSeasonMatches(userId, userCurrentTier);
```

---

## 🎮 **FLUXO REFORMULADO DO JOGO**

### **1. Criação do Time (Simplificado)**
```
Usuário cria time → 
23 jogadores criados → 
Inscrição automática na Série D → 
19 times da máquina já existem → 
Calendário de 38 rodadas criado → 
PRONTO PARA JOGAR! ⚽
```

### **2. Temporada Atual**
```
Usuário joga 38 rodadas (turno + returno) → 
Simula contra 19 times da máquina → 
Classificação em tempo real → 
Fim da temporada: posição final
```

### **3. Progressão (NOVO)**
```
Se terminar em 1º-4º: PROMOÇÃO! 🎉
Se terminar em 5º-16º: Continua na série
Se terminar em 17º-20º: REBAIXAMENTO 😔
```

### **4. Nova Temporada**
```
Nova série → 
Novos 19 times da máquina → 
Novo calendário → 
Recomeça o ciclo
```

---

## 📊 **SISTEMA DE SIMULAÇÃO REFORMULADO**

### **Atributos dos Times da Máquina**
- **Série A**: Atributos 80-95 (times elite)
- **Série B**: Atributos 70-85 (times fortes)
- **Série C**: Atributos 60-75 (times médios)
- **Série D**: Atributos 50-65 (times iniciantes)

### **Comportamento Previsível**
- Times da máquina **não evoluem**
- Atributos **fixos durante toda temporada**
- Resultado baseado em **atributos vs atributos**
- **Simulação realista** mas simplificada

---

## 🔍 **DEBUGGING REFORMULADO**

### **Scripts de Teste Reformulados**
```bash
# Testar sistema reformulado
node scripts/test-reformed-system.js

# Verificar times da máquina
node scripts/check-machine-teams.js

# Testar criação de time + série D
node scripts/test-user-creation-flow.js

# Verificar calendário gerado
node scripts/check-season-calendar.js
```

### **Logs Importantes**
- Backend: `🎮 REFORM:` para logs do sistema reformulado
- Frontend: `🎯 USER-SERIE:` para logs da série do usuário
- Simulação: `⚽ MATCH:` para logs de partidas

---

## 🚨 **PROBLEMAS REFORMULADOS**

### **1. Sistema Antigo vs Novo**
**❌ ANTIGO:** Sistema complexo com auto-população
**✅ NOVO:** Times da máquina fixos, criação simplificada

### **2. Dados Limpos**
```bash
# Limpar sistema antigo
node scripts/clean-old-system.js

# Implementar sistema novo
node scripts/implement-reformed-system.js
```

### **3. Migração de Dados**
```bash
# Migrar times existentes para novo sistema
node scripts/migrate-to-reformed-system.js
```

---

## 📝 **CONVENÇÕES REFORMULADAS**

### **Nomenclatura**
- **Arquivos**: `reformed-*.service.ts` (novos serviços)
- **Funções**: `getUserCurrentSerie()`, `getMachineTeams()`
- **Tabelas**: `game_*_reformed` (novas tabelas)

### **Estrutura de APIs Reformuladas**
```typescript
// Controller reformulado
@Controller('api/v2/seasons')
export class SeasonsController {
  @Get('current')
  async getCurrentSeason(@Query('userId') userId: string) {
    return this.seasonsService.getUserCurrentSeason(userId);
  }
}

// Service reformulado
@Injectable()
export class SeasonsService {
  async getUserCurrentSeason(userId: string) {
    // Buscar série atual do usuário
    // Buscar 19 times da máquina da série
    // Buscar calendário da temporada
    // Retornar dados simplificados
  }
}
```

---

## 🎯 **PRÓXIMOS PASSOS REFORMULADOS**

### **Implementação Prioritária** ✅
1. [x] **Schema reformulado** - Tabelas simplificadas criadas
2. [x] **Popular times da máquina** - 19 por série, fixos implementados
3. [x] **Reformular backend** - Services simplificados funcionais
4. [x] **Reformular frontend** - UI focada na série atual implementada
5. [x] **Sistema de temporadas** - Calendário automático funcional
6. [x] **Sistema de promoção/rebaixamento** - Backend implementado

### **Melhorias em Andamento** 🚧
1. [ ] **Sistema de fim de temporada completo** - Modal + continuidade
2. [ ] **Reformulação do painel do jogador** - Navegação simplificada
3. [ ] **Integração de competições no painel** - Aba principal de competições
4. [ ] **Transição automática entre temporadas** - UX fluida
5. [ ] **Sistema de notificações** - Avisos importantes ao jogador

### **Melhorias Futuras** 🔮
- [ ] Sistema de transferências (entre séries)
- [ ] Sistema de contratos (simples)
- [ ] Sistema de treinos (evolução do usuário)
- [ ] Sistema de táticas (4-4-2, 3-5-2, etc.)
- [ ] Sistema de estatísticas históricas
- [ ] Campeonatos especiais (Copas)

---

## 🎮 **SISTEMA DE FIM DE TEMPORADA (NOVO)**

### **Fluxo Reformulado de Fim de Temporada**
```
Usuário termina todas as 38 rodadas →
Sistema detecta automaticamente →
Calcula posição final →
Determina promoção/rebaixamento/permanência →
Exibe modal com resultado da temporada →
Usuário clica "Continuar" →
Sistema cria nova temporada na nova série →
Jogador continua jogando! 🎉
```

### **Modal de Fim de Temporada**
- 🏆 **Título da conquista** (ou resultado)
- 📊 **Estatísticas da temporada**
- 🎯 **Posição final e pontuação**
- ⬆️ **Status**: Promovido/Rebaixado/Permanece
- 🆕 **Próxima série** onde irá jogar
- ✨ **Animações e celebrações**
- 🔄 **Botão "Continuar para próxima temporada"**

### **Detecção Automática**
- Verificar se `games_played = 38`
- Status da temporada = `'active'`
- Todas as partidas com status `'finished'` ou `'simulated'`
- Chamar automaticamente `processSeasonEnd()`

---

## 🎛️ **PAINEL DO JOGADOR REFORMULADO (NOVO)**

### **Navegação Simplificada**
```
🏠 HOME
├── 📊 Dashboard Geral (times + resumos)
└── ⚽ Gerenciar Time
    ├── 🏆 Competição (ABA PRINCIPAL)
    ├── 👥 Jogadores
    ├── 🏟️ Estádio
    ├── 🏃 Academia
    ├── 💰 Finanças
    └── 📈 Estatísticas
```

### **Melhorias de UX**
1. **Aba "Competição" como principal** - Primeiro foco do jogador
2. **Dashboard mais visual** - Cards informativos
3. **Navegação breadcrumb** - Saber onde está
4. **Ações rápidas** - Botões de acesso direto
5. **Indicadores visuais** - Status da temporada, próxima partida
6. **Notificações** - Fim de temporada, eventos importantes

### **Integração com Sistema Reformulado**
- `CompetitionsManagerReformed` vira aba principal
- `MatchSimulator` integrado nas competições
- Dashboard mostra progresso da temporada
- Acesso rápido a simular próxima partida

---

## 📞 **STATUS DA REFORMULAÇÃO**

- **Projeto**: kmiza27-game (**REFORMULADO**)
- **Inspiração**: **Elifoot clássico**
- **Foco**: **Simplicidade + diversão**
- **Status**: **Pronto para implementação**

---

## 🏆 **DIFERENCIAL DA REFORMULAÇÃO**

### **Antes (Complexo)**
- ❌ Auto-população dinâmica
- ❌ Times da máquina evolutivos
- ❌ Múltiplas competições visíveis
- ❌ Sistema de balanceamento complexo

### **Depois (Simples)**
- ✅ 19 times da máquina fixos por série
- ✅ Usuário só vê sua série atual
- ✅ Progressão clara: subir de série
- ✅ Como o Elifoot clássico! 🎮

---

**⚠️ LEMBRE-SE**: A reformulação foca na **simplicidade e diversão** como o Elifoot original. O usuário deve criar um time e jogar imediatamente, sem complexidades desnecessárias!