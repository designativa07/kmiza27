# Correção: Série C Aparece Vazia

## Problema Identificado

A Série C aparece vazia porque a coluna `team_name` não existe na tabela `game_user_machine_team_stats`, causando que os nomes dos times apareçam como `undefined` no frontend.

## Solução

### Passo 1: Adicionar a coluna team_name

Execute no **Supabase SQL Editor**:

```sql
ALTER TABLE game_user_machine_team_stats 
ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);
```

### Passo 2: Atualizar os nomes dos times

Execute no **Supabase SQL Editor**:

```sql
UPDATE game_user_machine_team_stats 
SET team_name = (
  SELECT name 
  FROM game_machine_teams 
  WHERE game_machine_teams.id = game_user_machine_team_stats.team_id
)
WHERE team_name IS NULL OR team_name = '';
```

### Passo 3: Verificar a correção

Execute no **Supabase SQL Editor**:

```sql
SELECT 
  team_name, 
  points, 
  games_played,
  tier,
  season_year
FROM game_user_machine_team_stats 
WHERE user_id = '22fa9e4b-858e-49b5-b80c-1390f9665ac9'
  AND tier = 3 
  AND season_year = 2026
ORDER BY team_name;
```

## Correções no Código

Também corrigi o código para que futuras criações de estatísticas incluam o `team_name`:

### 1. promotion-relegation.service.ts
- Adicionado `team_name: team.name` no método `createZeroStatsForMachineTeams`

### 2. game-teams-reformed.service.ts  
- Adicionado `team_name: team.name` no método `createZeroStatsForMachineTeams`

## Teste

Após executar os comandos SQL acima, execute:

```bash
node scripts/fix-serie-c-complete.js
```

Isso verificará se a correção foi aplicada corretamente.

## Resultado Esperado

Após a correção, a Série C deve mostrar:
- 19 times da máquina com nomes corretos
- Estatísticas zeradas (0 pontos, 0 jogos)
- O time do usuário promovido (PFC) na lista

## Verificação no Frontend

1. Acesse o jogo
2. Vá para a aba "Competição" 
3. Verifique se a Série C agora mostra todos os times corretamente
4. Confirme que o time do usuário (PFC) aparece na classificação 