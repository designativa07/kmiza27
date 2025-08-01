-- Script simples para corrigir a tabela game_matches
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a coluna match_date existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_matches' AND column_name = 'match_date';

-- 2. Se a coluna match_date não existir, adicioná-la
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

-- 4. Tornar match_date NOT NULL se não for
ALTER TABLE game_matches ALTER COLUMN match_date SET NOT NULL;

-- 5. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_game_matches_home_team_id ON game_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_away_team_id ON game_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_date ON game_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_game_matches_status ON game_matches(status);

-- 6. Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Criar trigger se não existir
DROP TRIGGER IF EXISTS update_game_matches_updated_at ON game_matches;
CREATE TRIGGER update_game_matches_updated_at
    BEFORE UPDATE ON game_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- 9. Mensagem de sucesso
SELECT '✅ Tabela game_matches corrigida com sucesso!' as status; 