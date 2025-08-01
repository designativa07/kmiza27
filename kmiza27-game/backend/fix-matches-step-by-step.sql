-- Script passo a passo para corrigir a tabela game_matches
-- Execute cada comando separadamente no Supabase SQL Editor

-- PASSO 1: Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- PASSO 2: Adicionar coluna match_date se não existir
ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS match_date TIMESTAMP WITH TIME ZONE;

-- PASSO 3: Migrar dados da coluna 'date' para 'match_date' (se existir)
UPDATE game_matches 
SET match_date = date 
WHERE match_date IS NULL 
AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_matches' AND column_name = 'date');

-- PASSO 4: Remover coluna 'date' se existir
ALTER TABLE game_matches DROP COLUMN IF EXISTS date;

-- PASSO 5: Tornar match_date NOT NULL
ALTER TABLE game_matches ALTER COLUMN match_date SET NOT NULL;

-- PASSO 6: Criar índices
CREATE INDEX IF NOT EXISTS idx_game_matches_home_team_id ON game_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_away_team_id ON game_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_date ON game_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_game_matches_status ON game_matches(status);

-- PASSO 7: Criar função para trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASSO 8: Criar trigger
DROP TRIGGER IF EXISTS update_game_matches_updated_at ON game_matches;
CREATE TRIGGER update_game_matches_updated_at
    BEFORE UPDATE ON game_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PASSO 9: Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position; 