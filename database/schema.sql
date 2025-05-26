-- Schema do banco de dados para o sistema de futebol
-- Criação das tabelas principais

-- Enum para tipos de competição
CREATE TYPE competition_type AS ENUM ('pontos_corridos', 'mata_mata', 'grupos_e_mata_mata', 'copa');

-- Tabela de Competições
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type competition_type NOT NULL,
    season VARCHAR(20) NOT NULL,
    country VARCHAR(100),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    rules JSONB, -- Regras específicas da competição
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Times
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(500),
    short_name VARCHAR(50),
    logo_url TEXT,
    stadium VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Brasil',
    founded_year INTEGER,
    colors JSONB, -- Cores do time
    social_media JSONB, -- Links redes sociais
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Estádios
CREATE TABLE stadiums (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Brasil',
    capacity INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Times em Competições
CREATE TABLE competition_teams (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    group_name VARCHAR(50), -- Para competições com grupos
    position INTEGER, -- Posição na tabela
    points INTEGER DEFAULT 0,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    form VARCHAR(10), -- Últimos 5 jogos (V,E,D)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competition_id, team_id)
);

-- Enum para status da partida
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');

-- Tabela de Rodadas/Fases
CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    round_number INTEGER,
    phase VARCHAR(100), -- grupos, oitavas, quartas, semi, final
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Partidas
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    stadium_id INTEGER REFERENCES stadiums(id),
    match_date TIMESTAMP NOT NULL,
    status match_status DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    home_score_penalties INTEGER, -- Para mata-mata
    away_score_penalties INTEGER,
    attendance INTEGER,
    referee VARCHAR(255),
    broadcast_channels JSONB, -- Array de canais
    streaming_links JSONB, -- Links de transmissão
    highlights_url TEXT,
    match_stats JSONB, -- Estatísticas detalhadas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Gols
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id),
    player_name VARCHAR(255) NOT NULL,
    minute INTEGER,
    is_penalty BOOLEAN DEFAULT false,
    is_own_goal BOOLEAN DEFAULT false,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- Para login no painel admin
    favorite_team_id INTEGER REFERENCES teams(id),
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB, -- Preferências de notificação
    whatsapp_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Conversas do Chatbot
CREATE TABLE chatbot_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message_id VARCHAR(255),
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    intent VARCHAR(100), -- Intenção detectada
    entities JSONB, -- Entidades extraídas (times, competições, etc)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notificações
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- goal, match_start, match_end, news
    title VARCHAR(255),
    message TEXT NOT NULL,
    match_id INTEGER REFERENCES matches(id),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações do Sistema
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX idx_competition_teams ON competition_teams(competition_id, team_id);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_chatbot_conv_user ON chatbot_conversations(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_teams_updated_at BEFORE UPDATE ON competition_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações iniciais
INSERT INTO system_settings (key, value, description) VALUES
('openai_api_key', '{"key": "YOUR_OPENAI_API_KEY_HERE"}', 'OpenAI API Key - Configure via environment variables'),
('evolution_api_config', '{"server_url": "YOUR_EVOLUTION_API_URL", "api_key": "YOUR_EVOLUTION_API_KEY", "instance": "YOUR_INSTANCE_NAME"}', 'Evolution API Configuration - Configure via environment variables'),
('notification_settings', '{"goal_notification_delay": 0, "match_reminder_minutes": 15}', 'Notification timing settings');

-- Inserir dados de exemplo para as competições
INSERT INTO competitions (name, slug, type, season, country) VALUES
('Campeonato Brasileiro', 'brasileirao', 'pontos_corridos', '2024', 'Brasil'),
('Campeonato Brasileiro Série B', 'brasileirao-serie-b', 'pontos_corridos', '2024', 'Brasil'),
('Campeonato Brasileiro Série C', 'brasileirao-serie-c', 'pontos_corridos', '2024', 'Brasil'),
('Copa do Brasil', 'copa-do-brasil', 'copa', '2024', 'Brasil'),
('Copa Sul-Americana', 'copa-sul-americana', 'grupos_e_mata_mata', '2024', 'Internacional'),
('Copa Libertadores da América', 'libertadores', 'grupos_e_mata_mata', '2024', 'Internacional'),
('Mundial de Clubes', 'mundial-de-clubes', 'mata_mata', '2024', 'Internacional'),
('UEFA Champions League', 'champions-league', 'grupos_e_mata_mata', '2024/25', 'Europa'),
('UEFA Europa League', 'europa-league', 'grupos_e_mata_mata', '2024/25', 'Europa'),
('UEFA Conference League', 'conference-league', 'grupos_e_mata_mata', '2024/25', 'Europa'); 