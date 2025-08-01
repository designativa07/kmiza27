-- Script para corrigir as constraints de chave estrangeira
-- Permite a exclusão de times com exclusão em cascata das dependências
-- Criado em: 2025-01-30

-- 1. Remover as constraints existentes
ALTER TABLE IF EXISTS game_matches 
DROP CONSTRAINT IF EXISTS game_matches_home_team_id_fkey;

ALTER TABLE IF EXISTS game_matches 
DROP CONSTRAINT IF EXISTS game_matches_away_team_id_fkey;

-- 2. Recriar as constraints com ON DELETE CASCADE
ALTER TABLE game_matches 
ADD CONSTRAINT game_matches_home_team_id_fkey 
FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;

ALTER TABLE game_matches 
ADD CONSTRAINT game_matches_away_team_id_fkey 
FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;

-- 3. Verificar e corrigir outras tabelas que referenciam game_teams
-- game_competition_teams já tem ON DELETE CASCADE, mas vamos verificar
DO $$
BEGIN
    -- Verificar se a constraint existe e tem CASCADE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'game_competition_teams' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%team_id%'
    ) THEN
        -- Remover constraint existente se não tiver CASCADE
        ALTER TABLE game_competition_teams 
        DROP CONSTRAINT IF EXISTS game_competition_teams_team_id_fkey;
        
        -- Recriar com CASCADE
        ALTER TABLE game_competition_teams 
        ADD CONSTRAINT game_competition_teams_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. game_competition_matches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'game_competition_matches' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND (tc.constraint_name LIKE '%home_team_id%' OR tc.constraint_name LIKE '%away_team_id%')
    ) THEN
        -- Remover constraints existentes
        ALTER TABLE game_competition_matches 
        DROP CONSTRAINT IF EXISTS game_competition_matches_home_team_id_fkey;
        
        ALTER TABLE game_competition_matches 
        DROP CONSTRAINT IF EXISTS game_competition_matches_away_team_id_fkey;
        
        -- Recriar com CASCADE
        ALTER TABLE game_competition_matches 
        ADD CONSTRAINT game_competition_matches_home_team_id_fkey 
        FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_competition_matches 
        ADD CONSTRAINT game_competition_matches_away_team_id_fkey 
        FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. game_team_history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'game_team_history' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%team_id%'
    ) THEN
        ALTER TABLE game_team_history 
        DROP CONSTRAINT IF EXISTS game_team_history_team_id_fkey;
        
        ALTER TABLE game_team_history 
        ADD CONSTRAINT game_team_history_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. game_direct_matches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'game_direct_matches' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND (tc.constraint_name LIKE '%home_team_id%' OR tc.constraint_name LIKE '%away_team_id%' OR tc.constraint_name LIKE '%winner_team_id%')
    ) THEN
        -- Remover constraints existentes
        ALTER TABLE game_direct_matches 
        DROP CONSTRAINT IF EXISTS game_direct_matches_home_team_id_fkey;
        
        ALTER TABLE game_direct_matches 
        DROP CONSTRAINT IF EXISTS game_direct_matches_away_team_id_fkey;
        
        ALTER TABLE game_direct_matches 
        DROP CONSTRAINT IF EXISTS game_direct_matches_winner_team_id_fkey;
        
        -- Recriar com CASCADE
        ALTER TABLE game_direct_matches 
        ADD CONSTRAINT game_direct_matches_home_team_id_fkey 
        FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_direct_matches 
        ADD CONSTRAINT game_direct_matches_away_team_id_fkey 
        FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_direct_matches 
        ADD CONSTRAINT game_direct_matches_winner_team_id_fkey 
        FOREIGN KEY (winner_team_id) REFERENCES game_teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. game_head_to_head
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'game_head_to_head' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND (tc.constraint_name LIKE '%team1_id%' OR tc.constraint_name LIKE '%team2_id%')
    ) THEN
        -- Remover constraints existentes
        ALTER TABLE game_head_to_head 
        DROP CONSTRAINT IF EXISTS game_head_to_head_team1_id_fkey;
        
        ALTER TABLE game_head_to_head 
        DROP CONSTRAINT IF EXISTS game_head_to_head_team2_id_fkey;
        
        -- Recriar com CASCADE
        ALTER TABLE game_head_to_head 
        ADD CONSTRAINT game_head_to_head_team1_id_fkey 
        FOREIGN KEY (team1_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_head_to_head 
        ADD CONSTRAINT game_head_to_head_team2_id_fkey 
        FOREIGN KEY (team2_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. game_team_stats
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'game_team_stats' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%team_id%'
    ) THEN
        ALTER TABLE game_team_stats 
        DROP CONSTRAINT IF EXISTS game_team_stats_team_id_fkey;
        
        ALTER TABLE game_team_stats 
        ADD CONSTRAINT game_team_stats_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 9. youth_academies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'youth_academies' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%team_id%'
    ) THEN
        ALTER TABLE youth_academies 
        DROP CONSTRAINT IF EXISTS youth_academies_team_id_fkey;
        
        ALTER TABLE youth_academies 
        ADD CONSTRAINT youth_academies_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 10. youth_players
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'youth_players' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%team_id%'
    ) THEN
        ALTER TABLE youth_players 
        DROP CONSTRAINT IF EXISTS youth_players_team_id_fkey;
        
        ALTER TABLE youth_players 
        ADD CONSTRAINT youth_players_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 11. youth_tryouts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'youth_tryouts' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%team_id%'
    ) THEN
        ALTER TABLE youth_tryouts 
        DROP CONSTRAINT IF EXISTS youth_tryouts_team_id_fkey;
        
        ALTER TABLE youth_tryouts 
        ADD CONSTRAINT youth_tryouts_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verificar se as alterações foram aplicadas corretamente
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
ORDER BY tc.table_name, kcu.column_name;

-- Mensagem de confirmação
SELECT '✅ Constraints de chave estrangeira corrigidas com sucesso!' as status; 