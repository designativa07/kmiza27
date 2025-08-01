-- Script para verificar e corrigir a tabela game_matches
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_matches') THEN
        RAISE NOTICE 'Tabela game_matches não existe. Criando...';
        
        -- Criar tabela game_matches
        CREATE TABLE game_matches (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            home_team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
            away_team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
            home_team_name VARCHAR(255) NOT NULL,
            away_team_name VARCHAR(255) NOT NULL,
            match_date TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished')),
            home_score INTEGER DEFAULT 0,
            away_score INTEGER DEFAULT 0,
            highlights TEXT[] DEFAULT '{}',
            stats JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            finished_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Criar índices
        CREATE INDEX idx_game_matches_home_team_id ON game_matches(home_team_id);
        CREATE INDEX idx_game_matches_away_team_id ON game_matches(away_team_id);
        CREATE INDEX idx_game_matches_date ON game_matches(match_date);
        CREATE INDEX idx_game_matches_status ON game_matches(status);
        
        RAISE NOTICE 'Tabela game_matches criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela game_matches já existe. Verificando estrutura...';
        
        -- Verificar se a coluna match_date existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_matches' AND column_name = 'match_date') THEN
            RAISE NOTICE 'Coluna match_date não existe. Adicionando...';
            
            -- Adicionar coluna match_date
            ALTER TABLE game_matches ADD COLUMN match_date TIMESTAMP WITH TIME ZONE;
            
            -- Se existir coluna 'date', migrar dados
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_matches' AND column_name = 'date') THEN
                UPDATE game_matches SET match_date = date WHERE match_date IS NULL;
                ALTER TABLE game_matches DROP COLUMN date;
                RAISE NOTICE 'Dados migrados da coluna date para match_date';
            END IF;
            
            -- Tornar a coluna NOT NULL após migração
            ALTER TABLE game_matches ALTER COLUMN match_date SET NOT NULL;
            
            RAISE NOTICE 'Coluna match_date adicionada com sucesso!';
        ELSE
            RAISE NOTICE 'Coluna match_date já existe.';
        END IF;
        
        -- Verificar se a coluna 'date' ainda existe e removê-la
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'game_matches' AND column_name = 'date') THEN
            RAISE NOTICE 'Removendo coluna date antiga...';
            ALTER TABLE game_matches DROP COLUMN date;
            RAISE NOTICE 'Coluna date removida com sucesso!';
        END IF;
        
        -- Verificar e criar índices se não existirem
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'game_matches' AND indexname = 'idx_game_matches_date') THEN
            CREATE INDEX idx_game_matches_date ON game_matches(match_date);
            RAISE NOTICE 'Índice idx_game_matches_date criado!';
        END IF;
    END IF;
END $$;

-- 2. Verificar se a função update_updated_at_column existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE 'Criando função update_updated_at_column...';
        
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        RAISE NOTICE 'Função update_updated_at_column criada!';
    END IF;
END $$;

-- 3. Verificar se o trigger existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_game_matches_updated_at') THEN
        RAISE NOTICE 'Criando trigger update_game_matches_updated_at...';
        
        CREATE TRIGGER update_game_matches_updated_at
            BEFORE UPDATE ON game_matches
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Trigger update_game_matches_updated_at criado!';
    END IF;
END $$;

-- 4. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
ORDER BY ordinal_position;

-- 5. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela game_matches verificada e corrigida com sucesso!';
    RAISE NOTICE '📊 Estrutura: id, home_team_id, away_team_id, home_team_name, away_team_name, match_date, status, home_score, away_score, highlights, stats, created_at, updated_at, finished_at';
    RAISE NOTICE '🔍 Índices criados para otimização';
    RAISE NOTICE '⚡ Trigger para atualização automática de updated_at configurado';
END $$; 