-- Script para criar as tabelas relacionadas aos jogadores
-- Executar no banco de dados kmiza27

-- Criar tabela de jogadores
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    image_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de histórico de jogadores em times
CREATE TABLE IF NOT EXISTS player_team_history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    jersey_number VARCHAR(50),
    role VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_player_team_history_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    CONSTRAINT fk_player_team_history_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Criar tabela de cartões
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'yellow' ou 'red'
    minute INTEGER,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cards_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT fk_cards_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Atualizar tabela de gols para incluir player_id
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS player_id INTEGER,
ADD COLUMN IF NOT EXISTS type VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Adicionar foreign key para player_id na tabela goals se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_goals_player' 
        AND table_name = 'goals'
    ) THEN
        ALTER TABLE goals 
        ADD CONSTRAINT fk_goals_player 
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_player_team_history_player ON player_team_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_team_history_team ON player_team_history(team_id);
CREATE INDEX IF NOT EXISTS idx_player_team_history_active ON player_team_history(player_id, team_id) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_cards_match ON cards(match_id);
CREATE INDEX IF NOT EXISTS idx_cards_player ON cards(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_player ON goals(player_id);

-- Inserir alguns jogadores de exemplo para teste
INSERT INTO players (name, position, nationality) VALUES 
('Neymar Jr.', 'Atacante', 'Brasil'),
('Lionel Messi', 'Atacante', 'Argentina'),
('Cristiano Ronaldo', 'Atacante', 'Portugal'),
('Vinícius Jr.', 'Atacante', 'Brasil'),
('Kylian Mbappé', 'Atacante', 'França')
ON CONFLICT DO NOTHING;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_team_history_updated_at ON player_team_history;
CREATE TRIGGER update_player_team_history_updated_at 
    BEFORE UPDATE ON player_team_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se as tabelas foram criadas
SELECT 'players' as table_name, COUNT(*) as record_count FROM players
UNION ALL
SELECT 'player_team_history' as table_name, COUNT(*) as record_count FROM player_team_history
UNION ALL
SELECT 'cards' as table_name, COUNT(*) as record_count FROM cards; 