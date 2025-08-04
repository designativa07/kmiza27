-- =====================================================
-- MIGRAÇÃO: Criação das tabelas do sistema de bolão
-- Execute este SQL no banco PostgreSQL do seu projeto
-- =====================================================

-- Criar enum para status do bolão
CREATE TYPE pool_status AS ENUM ('draft', 'open', 'closed', 'finished');

-- Criar enum para tipo do bolão
CREATE TYPE pool_type AS ENUM ('round', 'custom');

-- Tabela principal dos bolões
CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status pool_status DEFAULT 'draft',
    type pool_type DEFAULT 'custom',
    competition_id INTEGER REFERENCES competitions(id) ON DELETE SET NULL,
    round_id INTEGER REFERENCES rounds(id) ON DELETE SET NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    scoring_rules JSONB DEFAULT '{"exact_score": 10, "correct_result": 5, "goal_difference": 3}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de jogos associados aos bolões
CREATE TABLE IF NOT EXISTS pool_matches (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pool_id, match_id)
);

-- Tabela de participantes dos bolões
CREATE TABLE IF NOT EXISTS pool_participants (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    exact_scores_count INTEGER DEFAULT 0,
    correct_results_count INTEGER DEFAULT 0,
    goal_difference_count INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_prediction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pool_id, user_id)
);

-- Tabela de palpites dos usuários
CREATE TABLE IF NOT EXISTS pool_predictions (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score_prediction INTEGER,
    away_score_prediction INTEGER,
    score INTEGER DEFAULT 0,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pool_id, user_id, match_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pools_status ON pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_type ON pools(type);
CREATE INDEX IF NOT EXISTS idx_pools_created_by ON pools(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pools_public ON pools(is_public);
CREATE INDEX IF NOT EXISTS idx_pools_dates ON pools(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_pool_matches_pool ON pool_matches(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_matches_match ON pool_matches(match_id);

CREATE INDEX IF NOT EXISTS idx_pool_participants_pool ON pool_participants(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_participants_user ON pool_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_participants_score ON pool_participants(total_score DESC);

CREATE INDEX IF NOT EXISTS idx_pool_predictions_pool ON pool_predictions(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_predictions_user ON pool_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_predictions_match ON pool_predictions(match_id);

-- Inserir um bolão de exemplo (opcional) - apenas se existir pelo menos um usuário
DO $$
DECLARE
    first_user_id INTEGER;
BEGIN
    -- Buscar o primeiro usuário disponível
    SELECT id INTO first_user_id FROM users ORDER BY id LIMIT 1;
    
    -- Se existir um usuário, criar o bolão de exemplo
    IF first_user_id IS NOT NULL THEN
        INSERT INTO pools (
            name, 
            description, 
            type, 
            status, 
            created_by_user_id, 
            is_public,
            scoring_rules
        ) VALUES (
            'Bolão Teste - Brasileirão 2024',
            'Bolão de exemplo para testar o sistema',
            'custom',
            'open',
            first_user_id,
            true,
            '{"exact_score": 10, "correct_result": 5, "goal_difference": 3}'::jsonb
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Bolão de exemplo criado com usuário ID: %', first_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado. Bolão de exemplo não foi criado.';
        RAISE NOTICE 'Para criar um bolão manualmente, use: INSERT INTO pools (...) com um user_id válido.';
    END IF;
END $$;

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('pools', 'pool_matches', 'pool_participants', 'pool_predictions')
ORDER BY table_name;

COMMENT ON TABLE pools IS 'Tabela principal dos bolões';
COMMENT ON TABLE pool_matches IS 'Jogos associados aos bolões';
COMMENT ON TABLE pool_participants IS 'Participantes dos bolões';
COMMENT ON TABLE pool_predictions IS 'Palpites dos usuários nos bolões';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================