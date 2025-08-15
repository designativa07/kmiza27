-- =====================================================
-- CORRIGIR TABELA DE LOGS DA ACADEMIA
-- Execute este SQL no Supabase Studio
-- =====================================================

-- 1. Dropar a tabela existente se houver problemas
DROP TABLE IF EXISTS game_academy_logs;

-- 2. Criar tabela de logs com estrutura correta
CREATE TABLE game_academy_logs (
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

-- 3. Criar índices para performance
CREATE INDEX idx_academy_logs_team_id ON game_academy_logs(team_id);
CREATE INDEX idx_academy_logs_player_id ON game_academy_logs(player_id);
CREATE INDEX idx_academy_logs_created_at ON game_academy_logs(created_at);

-- 4. Verificar se a tabela foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_academy_logs'
ORDER BY ordinal_position;
