-- =====================================================
-- ADICIONAR COLUNA finished_at NA TABELA game_season_matches
-- =====================================================

-- Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_name = 'game_season_matches' 
        AND column_name = 'finished_at'
    ) THEN
        -- Adicionar a coluna finished_at
        ALTER TABLE game_season_matches 
        ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE '✅ Coluna finished_at adicionada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Coluna finished_at já existe!';
    END IF;
END $$;

-- Adicionar comentário na coluna
COMMENT ON COLUMN game_season_matches.finished_at IS 'Data/hora quando a partida foi finalizada/simulada';

-- Verificar se foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_season_matches' 
AND column_name = 'finished_at';