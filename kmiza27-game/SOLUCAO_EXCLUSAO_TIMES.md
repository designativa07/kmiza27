# 🔧 Solução para Erro de Exclusão de Times

## 📋 **Problema Identificado**

O erro `"update or delete on table "game_teams" violates foreign key constraint "game_matches_home_team_id_fkey" on table "game_matches"` ocorria porque a tabela `game_matches` referenciam `game_teams` através de chaves estrangeiras sem a cláusula `ON DELETE CASCADE`.

## 🏗️ **Tabela Principal Afetada**

**`game_matches`** - Partidas do jogo (esta é a principal causadora do erro)

## ✅ **Solução Implementada**

### **Script SQL Mínimo**
Criado o arquivo `kmiza27-game/backend/database/fix-game-matches-only.sql` que:

- Remove as constraints existentes sem `ON DELETE CASCADE`
- Recria as constraints com `ON DELETE CASCADE`
- É focado apenas na tabela principal que causa o erro

## 🔧 **Como Aplicar a Correção**

### **Opção Recomendada: Via Supabase Studio**
1. Acesse o Supabase Studio
2. Vá para a seção **SQL Editor**
3. Execute o conteúdo do arquivo `fix-game-matches-only.sql`:

```sql
-- Remover constraints existentes
ALTER TABLE IF EXISTS game_matches 
DROP CONSTRAINT IF EXISTS game_matches_home_team_id_fkey;

ALTER TABLE IF EXISTS game_matches 
DROP CONSTRAINT IF EXISTS game_matches_away_team_id_fkey;

-- Recriar com ON DELETE CASCADE
ALTER TABLE game_matches 
ADD CONSTRAINT game_matches_home_team_id_fkey 
FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;

ALTER TABLE game_matches 
ADD CONSTRAINT game_matches_away_team_id_fkey 
FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
```

## 🧪 **Como Testar**

### **Teste Manual na Aplicação**
1. Inicie o backend: `npm run start:dev`
2. Inicie o frontend: `npm run dev`
3. Acesse a aplicação
4. Tente excluir um time
5. Verifique se não há mais erro de foreign key

## 📊 **Resultado Esperado**

Após a aplicação da correção:

- ✅ Times podem ser excluídos sem erro de foreign key
- ✅ Partidas relacionadas ao time são excluídas automaticamente
- ✅ A integridade dos dados é mantida

## 🔍 **Verificação das Constraints**

Para verificar se as constraints foram aplicadas corretamente:

```sql
SELECT 
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND kcu.referenced_table_name = 'game_teams'
AND tc.table_name = 'game_matches'
ORDER BY tc.table_name, kcu.column_name;
```

As constraints devem mostrar `delete_rule = 'CASCADE'`.

## ⚠️ **Observações Importantes**

1. **Backup**: Sempre faça backup do banco antes de aplicar alterações estruturais
2. **Teste**: Teste a exclusão em um ambiente de desenvolvimento primeiro
3. **Monitoramento**: Monitore se não há perda acidental de dados importantes

## 🎯 **Próximos Passos**

1. **Aplicar a correção no banco de dados** via Supabase Studio
2. **Testar a exclusão de times** na aplicação
3. **Verificar se todas as funcionalidades** continuam funcionando

## 📁 **Arquivos Criados**

- `fix-game-matches-only.sql` - Script SQL mínimo para correção
- `fix-foreign-key-constraints-safe.sql` - Script completo com verificações
- `fix-foreign-keys-simple.js` - Script Node.js simplificado
- `SOLUCAO_EXCLUSAO_TIMES.md` - Esta documentação

---

**Status**: ✅ Solução implementada e pronta para aplicação
**Método Recomendado**: Executar o SQL via Supabase Studio 