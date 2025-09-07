-- Script para preparar o banco de desenvolvimento antes da sincronização
-- Resolve problemas conhecidos de estrutura e constraints

-- 1. Verificar se estamos no banco de desenvolvimento
DO $$
BEGIN
    IF current_database() != 'kmiza27_dev' THEN
        RAISE EXCEPTION 'Este script deve ser executado apenas no banco de desenvolvimento (kmiza27_dev)';
    END IF;
END $$;

-- 2. Adicionar coluna retention_days na tabela simulation_results se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'simulation_results' 
        AND column_name = 'retention_days'
    ) THEN
        ALTER TABLE simulation_results ADD COLUMN retention_days INTEGER;
        RAISE NOTICE 'Coluna retention_days adicionada à tabela simulation_results';
    ELSE
        RAISE NOTICE 'Coluna retention_days já existe na tabela simulation_results';
    END IF;
END $$;

-- 3. Corrigir constraints de chave estrangeira para permitir sincronização
-- Remover constraints problemáticas temporariamente
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Lista de constraints que podem causar problemas durante sincronização
    FOR constraint_name IN 
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN (
            'pool_matches', 'pool_participants', 'users', 
            'goals', 'match_broadcasts', 'matches',
            'competition_teams', 'international_teams', 
            'player_team_history', 'simulation_results'
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', 
                (SELECT table_name FROM information_schema.table_constraints WHERE constraint_name = constraint_name),
                constraint_name
            );
            RAISE NOTICE 'Constraint % removida', constraint_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover constraint %: %', constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Verificar estrutura das tabelas principais
SELECT 
    'Verificação de estrutura' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('teams', 'users', 'matches', 'competitions')
ORDER BY table_name, ordinal_position;

-- 5. Mostrar estatísticas atuais do banco
SELECT 
    'Estatísticas do banco' as info,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as linhas_ativas
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

RAISE NOTICE '✅ Banco de desenvolvimento preparado para sincronização!';

