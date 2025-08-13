-- =====================================================
-- ADICIONAR COLUNAS DE TREINAMENTO ÀS TABELAS DE JOGADORES
-- =====================================================

-- 1. Adicionar colunas à tabela game_players
DO $$
BEGIN
    -- Verificar se a coluna is_in_academy existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='is_in_academy'
    ) THEN
        ALTER TABLE game_players ADD COLUMN is_in_academy boolean DEFAULT false;
        RAISE NOTICE 'Coluna is_in_academy adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna is_in_academy já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna training_focus existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='training_focus'
    ) THEN
        ALTER TABLE game_players ADD COLUMN training_focus text DEFAULT 'PAS';
        RAISE NOTICE 'Coluna training_focus adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna training_focus já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna training_intensity existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='training_intensity'
    ) THEN
        ALTER TABLE game_players ADD COLUMN training_intensity text DEFAULT 'normal';
        RAISE NOTICE 'Coluna training_intensity adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna training_intensity já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna training_type existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='training_type'
    ) THEN
        ALTER TABLE game_players ADD COLUMN training_type text DEFAULT 'mixed';
        RAISE NOTICE 'Coluna training_type adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna training_type já existe na tabela game_players';
    END IF;

    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_players' AND column_name='updated_at'
    ) THEN
        ALTER TABLE game_players ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela game_players';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe na tabela game_players';
    END IF;
END $$;

-- 2. Adicionar colunas à tabela youth_players
DO $$
BEGIN
    -- Verificar se a coluna is_in_academy existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='youth_players' AND column_name='is_in_academy'
    ) THEN
        ALTER TABLE youth_players ADD COLUMN is_in_academy boolean DEFAULT false;
        RAISE NOTICE 'Coluna is_in_academy adicionada à tabela youth_players';
    ELSE
        RAISE NOTICE 'Coluna is_in_academy já existe na tabela youth_players';
    END IF;

    -- Verificar se a coluna training_focus existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='youth_players' AND column_name='training_focus'
    ) THEN
        ALTER TABLE youth_players ADD COLUMN training_focus text DEFAULT 'PAS';
        RAISE NOTICE 'Coluna training_focus adicionada à tabela youth_players';
    ELSE
        RAISE NOTICE 'Coluna training_focus já existe na tabela youth_players';
    END IF;

    -- Verificar se a coluna training_intensity existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='youth_players' AND column_name='training_intensity'
    ) THEN
        ALTER TABLE youth_players ADD COLUMN training_intensity text DEFAULT 'normal';
        RAISE NOTICE 'Coluna training_intensity adicionada à tabela youth_players';
    ELSE
        RAISE NOTICE 'Coluna training_intensity já existe na tabela youth_players';
    END IF;

    -- Verificar se a coluna training_type existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='youth_players' AND column_name='training_type'
    ) THEN
        ALTER TABLE youth_players ADD COLUMN training_type text DEFAULT 'mixed';
        RAISE NOTICE 'Coluna training_type adicionada à tabela youth_players';
    ELSE
        RAISE NOTICE 'Coluna training_type já existe na tabela youth_players';
    END IF;

    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='youth_players' AND column_name='updated_at'
    ) THEN
        ALTER TABLE youth_players ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela youth_players';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe na tabela youth_players';
    END IF;
END $$;

-- 3. Criar tabela de logs de treinamento se não existir
CREATE TABLE IF NOT EXISTS game_academy_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES game_teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    player_name text,
    week text,
    focus text,
    intensity text,
    total_points decimal(5,2),
    attribute_gains jsonb,
    injury_result jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_academy_logs_team_id ON game_academy_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_academy_logs_player_id ON game_academy_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_academy_logs_created_at ON game_academy_logs(created_at);

-- 5. Verificar se as colunas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('game_players', 'youth_players') 
    AND column_name IN ('is_in_academy', 'training_focus', 'training_intensity', 'training_type', 'updated_at')
ORDER BY table_name, column_name;
