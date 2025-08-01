-- Script completo para corrigir a tabela game_matches
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT '=== ESTRUTURA ATUAL ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas que podem estar faltando
SELECT '=== ADICIONANDO COLUNAS FALTANDO ===' as info;

ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS home_team_name VARCHAR(255);

ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS away_team_name VARCHAR(255);

ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS match_date TIMESTAMP WITH TIME ZONE;

-- 3. Migrar dados da coluna 'date' para 'match_date' se necessário
SELECT '=== MIGRANDO DADOS ===' as info;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_matches' AND column_name = 'date') THEN
        -- Migrar dados da coluna date para match_date
        UPDATE game_matches SET match_date = date WHERE match_date IS NULL AND date IS NOT NULL;
        RAISE NOTICE 'Dados migrados da coluna date para match_date';
        
        -- Remover coluna date
        ALTER TABLE game_matches DROP COLUMN date;
        RAISE NOTICE 'Coluna date removida';
    END IF;
END $$;

-- 4. Tornar colunas obrigatórias
SELECT '=== CONFIGURANDO CONSTRAINTS ===' as info;

ALTER TABLE game_matches ALTER COLUMN home_team_name SET NOT NULL;
ALTER TABLE game_matches ALTER COLUMN away_team_name SET NOT NULL;
ALTER TABLE game_matches ALTER COLUMN match_date SET NOT NULL;

-- 5. Criar índices para melhor performance
SELECT '=== CRIANDO ÍNDICES ===' as info;

CREATE INDEX IF NOT EXISTS idx_game_matches_home_team_id ON game_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_away_team_id ON game_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_match_date ON game_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_game_matches_status ON game_matches(status);

-- 6. Verificar estrutura final
SELECT '=== ESTRUTURA FINAL ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- 7. Testar inserção de dados de exemplo
SELECT '=== TESTANDO INSERÇÃO ===' as info;

-- Inserir dados de teste se a tabela estiver vazia
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM game_matches LIMIT 1) THEN
        INSERT INTO game_matches (
            home_team_id,
            away_team_id,
            home_team_name,
            away_team_name,
            match_date,
            status,
            home_score,
            away_score
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(),
            'Time Teste Casa',
            'Time Teste Visitante',
            NOW() + INTERVAL '7 days',
            'scheduled',
            0,
            0
        );
        RAISE NOTICE 'Dados de teste inseridos com sucesso';
    ELSE
        RAISE NOTICE 'Tabela já contém dados, pulando inserção de teste';
    END IF;
END $$;

-- 8. Mensagem de sucesso
SELECT '✅ Tabela game_matches corrigida com sucesso!' as status; 