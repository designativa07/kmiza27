-- =====================================================
-- ADICIONAR COLUNAS FALTANTES PARA O SISTEMA DA ACADEMIA
-- Execute este SQL no Supabase Studio
-- =====================================================

-- 1. ADICIONAR COLUNAS DE ATRIBUTOS À TABELA game_players
DO $$
BEGIN
    -- Verificar se a coluna pace existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='pace'
    ) THEN
        ALTER TABLE game_players ADD COLUMN pace integer DEFAULT 50;
        RAISE NOTICE 'Coluna pace adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna pace já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna shooting existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='shooting'
    ) THEN
        ALTER TABLE game_players ADD COLUMN shooting integer DEFAULT 50;
        RAISE NOTICE 'Coluna shooting adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna shooting já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna passing existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='passing'
    ) THEN
        ALTER TABLE game_players ADD COLUMN passing integer DEFAULT 50;
        RAISE NOTICE 'Coluna passing adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna passing já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna dribbling existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='dribbling'
    ) THEN
        ALTER TABLE game_players ADD COLUMN dribbling integer DEFAULT 50;
        RAISE NOTICE 'Coluna dribbling adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna dribbling já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna defending existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='defending'
    ) THEN
        ALTER TABLE game_players ADD COLUMN defending integer DEFAULT 50;
        RAISE NOTICE 'Coluna defending adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna defending já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna physical existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='physical'
    ) THEN
        ALTER TABLE game_players ADD COLUMN physical integer DEFAULT 50;
        RAISE NOTICE 'Coluna physical adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna physical já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna potential existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='potential'
    ) THEN
        ALTER TABLE game_players ADD COLUMN potential integer DEFAULT 50;
        RAISE NOTICE 'Coluna potential adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna potential já existe na tabela game_players';
    END IF;
END $$;

-- 2. ADICIONAR COLUNA STATUS À TABELA game_investments
DO $$
BEGIN
    -- Verificar se a coluna status existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_investments' AND column_name='status'
    ) THEN
        ALTER TABLE game_investments ADD COLUMN status text DEFAULT 'active';
        RAISE NOTICE 'Coluna status adicionada à tabela game_investments';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela game_investments';
    END IF;
END $$;

-- 3. VERIFICAR SE AS COLUNAS FORAM CRIADAS CORRETAMENTE
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('game_players', 'game_investments') 
    AND column_name IN ('pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical', 'potential', 'status')
ORDER BY table_name, column_name;

-- 4. ATUALIZAR JOGADORES EXISTENTES COM VALORES PADRÃO (se necessário)
UPDATE game_players 
SET 
    pace = COALESCE(pace, 50),
    shooting = COALESCE(shooting, 50),
    passing = COALESCE(passing, 50),
    dribbling = COALESCE(dribbling, 50),
    defending = COALESCE(defending, 50),
    physical = COALESCE(physical, 50),
    potential = COALESCE(potential, 50)
WHERE 
    pace IS NULL OR 
    shooting IS NULL OR 
    passing IS NULL OR 
    dribbling IS NULL OR 
    defending IS NULL OR 
    physical IS NULL OR 
    potential IS NULL;

-- 5. ATUALIZAR INVESTIMENTOS EXISTENTES COM STATUS ATIVO (se necessário)
UPDATE game_investments 
SET status = 'active' 
WHERE status IS NULL;

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
    'game_players' as table_name,
    COUNT(*) as total_players,
    COUNT(pace) as players_with_pace,
    COUNT(shooting) as players_with_shooting,
    COUNT(passing) as players_with_passing,
    COUNT(dribbling) as players_with_dribbling,
    COUNT(defending) as players_with_defending,
    COUNT(physical) as players_with_physical,
    COUNT(potential) as players_with_potential
FROM game_players

UNION ALL

SELECT 
    'game_investments' as table_name,
    COUNT(*) as total_investments,
    COUNT(status) as investments_with_status,
    NULL, NULL, NULL, NULL, NULL, NULL
FROM game_investments;
