# 🎮 GUIA IA GAME - kmiza27-game

## 📋 **VISÃO GERAL DO PROJETO**

Este é um jogo de futebol gerenciador onde usuários criam times, participam de competições e gerenciam suas equipes. O projeto usa NestJS (backend), Next.js (frontend) e Supabase (banco de dados).

---

## 🏗️ **ARQUITETURA DO PROJETO**

### **Estrutura de Diretórios**
```
kmiza27-game/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── modules/        # Módulos do jogo
│   │   ├── config/         # Configurações
│   │   └── database/       # Conexão com Supabase
│   ├── scripts/            # Scripts de migração/teste
│   └── database/           # Schema SQL
├── frontend/               # Interface Next.js
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── services/       # APIs do frontend
│   │   └── store/          # Estado global
└── docs/                   # Documentação
```

### **Tecnologias Principais**
- **Backend**: NestJS + TypeScript
- **Frontend**: Next.js + React + TypeScript
- **Banco**: Supabase (PostgreSQL)
- **Estado**: Zustand
- **UI**: Tailwind CSS

---

## 🗄️ **BANCO DE DADOS**

### **Tabelas Principais**
- `game_users` - Usuários do jogo
- `game_teams` - Times dos usuários
- `youth_players` - Jogadores (23 por time)
- `youth_academies` - Academias de base
- `game_matches` - Partidas
- `game_competitions` - Competições
- `game_direct_matches` - Partidas diretas

### **Conexão com Supabase**
```javascript
// Usar sempre o arquivo centralizado
const { getSupabaseClient, testConnection } = require('./config/supabase-connection');

// Para operações normais
const supabase = getSupabaseClient('vps'); // ou 'local'

// Para operações administrativas
const supabase = getSupabaseServiceClient('vps');
```

---

## 🎯 **FUNCIONALIDADES IMPLEMENTADAS**

### **1. Sistema de Times**
- ✅ Criação automática de 23 jogadores por time
- ✅ Distribuição por posições específicas
- ✅ Atributos realistas por posição
- ✅ Sistema de potencial de evolução

### **2. Sistema de Competições**
- ✅ Hierarquia: Série A → B → C → D
- ✅ Promoção/rebaixamento automático
- ✅ Competições PvP e PvE
- ✅ Partidas diretas entre usuários

### **3. Sistema de Jogadores**
- ✅ 23 jogadores por time com posições:
  - 3 Goleiros
  - 4 Zagueiros
  - 2 Laterais Esquerdo
  - 2 Laterais Direito
  - 2 Atacantes
  - 2 Centroavantes
  - 2 Meias Ofensivos
  - 2 Volantes
  - 2 Meias Central
  - 1 Ponta Esquerda
  - 1 Ponta Direita

---

## ⚙️ **CONFIGURAÇÕES DE AMBIENTE**

### **Ambientes Disponíveis**
- **VPS (Produção)**: `https://kmiza27-supabase.h4xd66.easypanel.host`
- **Local (Dev)**: `http://localhost:54321`

### **Chaves de Acesso**
```javascript
// VPS - Anon Key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

// VPS - Service Key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
```

---

## 🚀 **COMANDOS IMPORTANTES**

### **Backend**
```bash
# Iniciar desenvolvimento
npm run start:dev

# Testar conexão
node scripts/test-connection.js

# Executar migrações
node scripts/execute-migration.js
```

### **Frontend**
```bash
# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## 🔧 **REGRAS DE DESENVOLVIMENTO**

### **1. Comandos no Windows**
**SEMPRE usar `;` em vez de `&&`**:
```bash
# ❌ ERRADO (não funciona no Windows)
cd backend && npm run start:dev

# ✅ CORRETO (funciona no Windows)
cd backend; npm run start:dev
```

### **2. Conexão com Supabase**
**SEMPRE usar o arquivo centralizado**:
```javascript
// ❌ ERRADO
const supabase = createClient(url, key);

// ✅ CORRETO
const { getSupabaseClient } = require('./config/supabase-connection');
const supabase = getSupabaseClient('vps');
```

### **3. Estrutura de Arquivos**
- **Backend**: Sempre em `kmiza27-game/backend/`
- **Frontend**: Sempre em `kmiza27-game/frontend/`
- **Scripts**: Sempre em `kmiza27-game/backend/scripts/`
- **Documentação**: Sempre em `kmiza27-game/docs/`

---

## 🎮 **FUNCIONALIDADES DO JOGO**

### **Sistema de Times**
- Cada usuário pode criar múltiplos times
- Times começam com 23 jogadores automaticamente
- Sistema de orçamento e reputação
- Estádio expansível

### **Sistema de Competições**
- **Série D**: Divisão de entrada
- **Série C**: Terceira divisão
- **Série B**: Segunda divisão
- **Série A**: Elite do futebol
- Promoção/rebaixamento automático

### **Sistema de Partidas**
- Simulação realista baseada em atributos
- Estatísticas detalhadas
- Highlights automáticos
- Sistema de convites para partidas diretas

---

## 📊 **ATRIBUTOS DOS JOGADORES**

### **Atributos Base**
- **Pace**: Velocidade (50-99)
- **Shooting**: Finalização (50-99)
- **Passing**: Passe (50-99)
- **Dribbling**: Drible (50-99)
- **Defending**: Defesa (50-99)
- **Physical**: Físico (50-99)

### **Atributos por Posição**
- **Goleiros**: Defesa alta (75-90), Físico alto (70-85)
- **Zagueiros**: Defesa alta (70-85), Físico alto (70-85)
- **Laterais**: Velocidade alta (70-85), Defesa média (65-80)
- **Volantes**: Defesa alta (70-85), Físico alto (70-85)
- **Meias**: Passe alto (70-85), Drible bom (65-80)
- **Atacantes**: Finalização alta (70-85), Velocidade alta (70-85)

---

## 🔍 **DEBUGGING E TESTES**

### **Scripts de Teste Disponíveis**
- `test-connection.js` - Testar conexão Supabase
- `test-team-creation.js` - Testar criação de times
- `check-players.js` - Verificar jogadores criados
- `execute-migration.js` - Executar migrações SQL

### **Logs Importantes**
- Backend: `console.log()` com emojis para identificação
- Frontend: `console.log()` para debugging
- Supabase: Verificar logs no dashboard

---

## 🚨 **PROBLEMAS COMUNS**

### **1. Erro de Conexão**
```bash
# Testar conectividade
node scripts/test-connection.js
```

### **2. RLS (Row Level Security)**
- Políticas de segurança ativas
- Usar service key para operações administrativas
- Verificar permissões no Supabase Studio

### **3. Comandos Windows**
- Sempre usar `;` em vez de `&&`
- Usar PowerShell ou CMD
- Verificar permissões de execução

---

## 📝 **CONVENÇÕES DE CÓDIGO**

### **Nomenclatura**
- **Arquivos**: kebab-case (`game-teams.service.ts`)
- **Classes**: PascalCase (`GameTeamsService`)
- **Funções**: camelCase (`createTeam`)
- **Constantes**: UPPER_SNAKE_CASE (`SUPABASE_CONFIG`)

### **Estrutura de APIs**
```typescript
// Controller
@Controller('api/v1/game-teams')
export class GameTeamsController {
  @Post()
  async createTeam(@Body() data: any) {
    // Lógica
  }
}

// Service
@Injectable()
export class GameTeamsService {
  async createTeam(userId: string, data: any) {
    // Lógica de negócio
  }
}
```

---

## 🔧 **MIGRAÇÕES E CORREÇÕES DE BANCO**

### **Scripts de Diagnóstico**
```bash
# Verificar estrutura da tabela
node scripts/check-matches-table.js

# Testar conexão com banco
node scripts/test-connection.js

# Verificar dados de exemplo
node scripts/check-players.js
```

### **Scripts de Correção**
```bash
# Adicionar coluna finished_at
node scripts/add-finished-at-column.js

# Corrigir estrutura completa da tabela
node scripts/fix-matches-table.js
```

### **Processo de Correção de Erros de Schema**

#### **1. Identificar o Problema**
```javascript
// Exemplo: Erro de coluna não encontrada
Error: Could not find the 'finished_at' column of 'game_matches' in the schema cache
```

#### **2. Criar Script de Diagnóstico**
```javascript
// scripts/check-table-structure.js
const { getSupabaseClient } = require('../config/supabase-connection');

async function checkTableStructure() {
  const supabase = getSupabaseClient('vps');
  
  // Verificar se a tabela existe
  const { data, error } = await supabase
    .from('game_matches')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Tabela não existe ou não está acessível');
    return;
  }
  
  // Verificar colunas disponíveis
  if (data && data.length > 0) {
    const sample = data[0];
    console.log('📋 Colunas disponíveis:');
    Object.keys(sample).forEach(col => {
      console.log(`  - ${col}: ${typeof sample[col]}`);
    });
  }
}
```

#### **3. Criar Script de Correção**
```javascript
// scripts/fix-table-structure.js
const { getSupabaseClient } = require('../config/supabase-connection');

async function fixTableStructure() {
  const supabase = getSupabaseClient('vps');
  
  // Script SQL para correção
  const sqlScript = `
-- Adicionar coluna se não existir
ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;

-- Verificar se foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
AND column_name = 'finished_at';
  `;
  
  console.log('📄 Script SQL para executar no Supabase:');
  console.log(sqlScript);
}
```

#### **4. Aplicar a Correção**
1. **Via Supabase Dashboard:**
   - Acesse o SQL Editor
   - Cole o script gerado
   - Execute o script
   - Verifique o resultado

2. **Via Script Automático (se disponível):**
   ```bash
   node scripts/fix-table-structure.js
   ```

### **Padrões para Scripts de Migração**

#### **Estrutura Recomendada**
```javascript
const { getSupabaseClient } = require('../config/supabase-connection');

async function migrationScript() {
  try {
    console.log('🔧 Executando migração...');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Verificar estado atual
    console.log('📋 Verificando estado atual...');
    
    // 2. Executar correção
    console.log('🔧 Aplicando correção...');
    
    // 3. Verificar resultado
    console.log('✅ Verificando resultado...');
    
    // 4. Testar funcionalidade
    console.log('🧪 Testando funcionalidade...');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}
```

#### **Comandos Úteis**
```bash
# Verificar estrutura de qualquer tabela
node scripts/check-table.js --table=game_matches

# Criar script de correção
node scripts/create-fix-script.js --table=game_matches --column=finished_at

# Executar migração completa
node scripts/run-migration.js --migration=add-finished-at
```

### **Checklist de Migração**
- [ ] Identificar erro específico
- [ ] Criar script de diagnóstico
- [ ] Verificar estrutura atual
- [ ] Criar script de correção
- [ ] Testar em ambiente de desenvolvimento
- [ ] Aplicar em produção
- [ ] Verificar funcionalidade
- [ ] Documentar mudanças

---

## 🎯 **PRÓXIMOS PASSOS**

### **Funcionalidades Planejadas**
- [ ] Sistema de transferências
- [ ] Sistema de contratos
- [ ] Sistema de lesões
- [ ] Sistema de treinos
- [ ] Sistema de táticas
- [ ] Sistema de mercado

### **Melhorias Técnicas**
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento de performance
- [ ] Cache Redis
- [ ] WebSocket para tempo real

---

## 📞 **CONTATO E SUPORTE**

- **Projeto**: kmiza27-game
- **Ambiente**: Windows + PowerShell
- **Banco**: Supabase VPS
- **Status**: Em desenvolvimento ativo

---

**⚠️ LEMBRE-SE**: Sempre usar `;` em vez de `&&` no Windows e sempre usar o arquivo de conexão centralizado para Supabase! 