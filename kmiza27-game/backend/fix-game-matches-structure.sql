-- Script para corrigir a estrutura da tabela game_matches
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas que podem estar faltando
ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS home_team_name VARCHAR(255);

ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS away_team_name VARCHAR(255);

ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS match_date TIMESTAMP WITH TIME ZONE;

-- 3. Se existir coluna 'date', migrar dados e remover
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_matches' AND column_name = 'date') THEN
        -- Migrar dados da coluna date para match_date
        UPDATE game_matches SET match_date = date WHERE match_date IS NULL;
        -- Remover coluna date
        ALTER TABLE game_matches DROP COLUMN date;
        RAISE NOTICE 'Dados migrados da coluna date para match_date e coluna date removida';
    END IF;
END $$;

-- 4. Tornar colunas obrigatórias se necessário
ALTER TABLE game_matches ALTER COLUMN home_team_name SET NOT NULL;
ALTER TABLE game_matches ALTER COLUMN away_team_name SET NOT NULL;
ALTER TABLE game_matches ALTER COLUMN match_date SET NOT NULL;

-- 5. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_game_matches_home_team_id ON game_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_away_team_id ON game_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_match_date ON game_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_game_matches_status ON game_matches(status);

-- 6. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- 7. Mensagem de sucesso
SELECT '✅ Estrutura da tabela game_matches corrigida com sucesso!' as status; 