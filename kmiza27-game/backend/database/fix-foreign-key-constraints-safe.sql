-- Script seguro para corrigir as constraints de chave estrangeira
-- Verifica a existência das tabelas antes de modificar constraints
-- Criado em: 2025-01-30

-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name
    );
END;
$$ LANGUAGE plpgsql;

-- 1. Corrigir game_matches (sempre existe)
DO $$
BEGIN
    IF table_exists('game_matches') THEN
        -- Remover constraints existentes
        ALTER TABLE game_matches 
        DROP CONSTRAINT IF EXISTS game_matches_home_team_id_fkey;
        
        ALTER TABLE game_matches 
        DROP CONSTRAINT IF EXISTS game_matches_away_team_id_fkey;
        
        -- Recriar com CASCADE
        ALTER TABLE game_matches 
        ADD CONSTRAINT game_matches_home_team_id_fkey 
        FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        ALTER TABLE game_matches 
        ADD CONSTRAINT game_matches_away_team_id_fkey 
        FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Constraints de game_matches corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_matches não existe, pulando...';
    END IF;
END $$;

-- 2. Corrigir game_competition_teams (sistema de competições)
DO $$
BEGIN
    IF table_exists('game_competition_teams') THEN
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
        RAISE NOTICE '✅ Constraints de game_competition_teams corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_competition_teams não existe, pulando...';
    END IF;
END $$;

-- 3. Corrigir game_competition_matches
DO $$
BEGIN
    IF table_exists('game_competition_matches') THEN
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
        RAISE NOTICE '✅ Constraints de game_competition_matches corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_competition_matches não existe, pulando...';
    END IF;
END $$;

-- 4. Corrigir game_team_history
DO $$
BEGIN
    IF table_exists('game_team_history') THEN
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
        RAISE NOTICE '✅ Constraints de game_team_history corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_team_history não existe, pulando...';
    END IF;
END $$;

-- 5. Corrigir game_direct_matches
DO $$
BEGIN
    IF table_exists('game_direct_matches') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_name = 'game_direct_matches' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND rc.delete_rule = 'CASCADE'
            AND (tc.constraint_name LIKE '%home_team_id%' OR tc.constraint_name LIKE '%away_team_id%')
        ) THEN
            -- Remover constraints existentes
            ALTER TABLE game_direct_matches 
            DROP CONSTRAINT IF EXISTS game_direct_matches_home_team_id_fkey;
            
            ALTER TABLE game_direct_matches 
            DROP CONSTRAINT IF EXISTS game_direct_matches_away_team_id_fkey;
            
            -- Recriar com CASCADE
            ALTER TABLE game_direct_matches 
            ADD CONSTRAINT game_direct_matches_home_team_id_fkey 
            FOREIGN KEY (home_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
            
            ALTER TABLE game_direct_matches 
            ADD CONSTRAINT game_direct_matches_away_team_id_fkey 
            FOREIGN KEY (away_team_id) REFERENCES game_teams(id) ON DELETE CASCADE;
        END IF;
        RAISE NOTICE '✅ Constraints de game_direct_matches corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_direct_matches não existe, pulando...';
    END IF;
END $$;

-- 6. Corrigir game_head_to_head
DO $$
BEGIN
    IF table_exists('game_head_to_head') THEN
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
        RAISE NOTICE '✅ Constraints de game_head_to_head corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_head_to_head não existe, pulando...';
    END IF;
END $$;

-- 7. Corrigir game_team_stats
DO $$
BEGIN
    IF table_exists('game_team_stats') THEN
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
        RAISE NOTICE '✅ Constraints de game_team_stats corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela game_team_stats não existe, pulando...';
    END IF;
END $$;

-- 8. Corrigir youth_academies
DO $$
BEGIN
    IF table_exists('youth_academies') THEN
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
        RAISE NOTICE '✅ Constraints de youth_academies corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela youth_academies não existe, pulando...';
    END IF;
END $$;

-- 9. Corrigir youth_players
DO $$
BEGIN
    IF table_exists('youth_players') THEN
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
        RAISE NOTICE '✅ Constraints de youth_players corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela youth_players não existe, pulando...';
    END IF;
END $$;

-- 10. Corrigir youth_tryouts
DO $$
BEGIN
    IF table_exists('youth_tryouts') THEN
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
        RAISE NOTICE '✅ Constraints de youth_tryouts corrigidas';
    ELSE
        RAISE NOTICE '⚠️ Tabela youth_tryouts não existe, pulando...';
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

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS table_exists(TEXT);

-- Mensagem de confirmação
SELECT '✅ Constraints de chave estrangeira corrigidas com sucesso!' as status; 