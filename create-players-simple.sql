-- Criar tabela de jogadores
CREATE TABLE players (
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
CREATE TABLE player_team_history (
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
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    minute INTEGER,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cards_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT fk_cards_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Atualizar tabela de gols para incluir player_id
ALTER TABLE goals ADD COLUMN player_id INTEGER;
ALTER TABLE goals ADD COLUMN type VARCHAR(255);
ALTER TABLE goals ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Adicionar foreign key para player_id na tabela goals
ALTER TABLE goals ADD CONSTRAINT fk_goals_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Inserir alguns jogadores de exemplo para teste
INSERT INTO players (name, position, nationality) VALUES 
('Neymar Jr.', 'Atacante', 'Brasil'),
('Lionel Messi', 'Atacante', 'Argentina'),
('Cristiano Ronaldo', 'Atacante', 'Portugal'),
('Vinícius Jr.', 'Atacante', 'Brasil'),
('Kylian Mbappé', 'Atacante', 'França'); 