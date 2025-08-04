# 🧹 LIMPEZA: Remoção do Sistema Antigo

## 📋 Módulos/Arquivos para Remover

### **SISTEMA ANTIGO (REMOVER COMPLETAMENTE):**
```
❌ src/modules/game-teams/game-teams.service.ts (1508 linhas)
❌ src/modules/game-teams/game-teams.controller.ts  
❌ src/modules/game-teams/game-teams.module.ts
❌ src/modules/competitions/ (todo o diretório)
❌ src/modules/matches/ (todo o diretório)
❌ src/modules/standings/ (todo o diretório)
❌ Scripts antigos em /scripts/ que referenciam tabelas antigas
```

### **SISTEMA REFORMULADO (MANTER E MELHORAR):**
```
✅ src/modules/game-teams/game-teams-reformed.service.ts
✅ src/modules/game-teams/game-teams-reformed.controller.ts
✅ src/modules/game-teams/game-teams-reformed.module.ts
✅ src/modules/machine-teams/
✅ src/modules/seasons/
✅ src/modules/promotion-relegation/
```

## 🗄️ Tabelas do Banco

### **TABELAS ANTIGAS (PODEM SER REMOVIDAS):**
```sql
-- Essas tabelas do sistema antigo podem ser dropadas
DROP TABLE IF EXISTS game_teams CASCADE;
DROP TABLE IF EXISTS game_competitions CASCADE; 
DROP TABLE IF EXISTS game_matches CASCADE;
DROP TABLE IF EXISTS game_competition_teams CASCADE;
DROP TABLE IF EXISTS game_standings CASCADE;
DROP TABLE IF EXISTS game_rounds CASCADE;
DROP TABLE IF EXISTS game_direct_matches CASCADE;
```

### **TABELAS REFORMULADAS (MANTER):**
```sql
-- Sistema reformulado (manter)
game_machine_teams ✅
game_user_competition_progress ✅
game_season_matches ✅
game_season_history ✅
game_competitions_fixed ✅
```

## 🔄 Plano de Limpeza

### **PASSO 1: Backup de Segurança**
- Backup completo do banco atual
- Export dos dados importantes

### **PASSO 2: Remoção dos Módulos Antigos** 
- Deletar diretórios antigos
- Remover imports do app.module.ts
- Limpar referências no código

### **PASSO 3: Limpeza do Banco**
- Drop das tabelas antigas
- Verificar foreign keys

### **PASSO 4: Refatoração Final**
- Remover scripts antigos
- Atualizar documentação
- Testes finais

**CONFIRMA A LIMPEZA?** ⚠️