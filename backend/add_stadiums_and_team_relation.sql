-- Migração manual: Adicionar tabela stadiums e relação com teams
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Criar tabela stadiums
CREATE TABLE IF NOT EXISTS stadiums (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255) DEFAULT 'Brasil',
    capacity INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar coluna stadium_id na tabela teams (se não existir)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'stadium_id'
    ) THEN
        ALTER TABLE teams ADD COLUMN stadium_id INTEGER;
    END IF;
END $$;

-- 3. Criar foreign key constraint para stadium_id (se não existir)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_teams_stadium_id' AND table_name = 'teams'
    ) THEN
        ALTER TABLE teams 
        ADD CONSTRAINT FK_teams_stadium_id 
        FOREIGN KEY (stadium_id) REFERENCES stadiums(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Criar índice na coluna stadium_id para melhor performance
CREATE INDEX IF NOT EXISTS idx_teams_stadium_id ON teams(stadium_id);

-- 5. Inserir alguns estádios de exemplo (opcional)
INSERT INTO stadiums (name, city, state, country, capacity) VALUES
('Maracanã', 'Rio de Janeiro', 'RJ', 'Brasil', 78838),
('Arena Corinthians', 'São Paulo', 'SP', 'Brasil', 49205),
('Allianz Parque', 'São Paulo', 'SP', 'Brasil', 43713),
('Beira-Rio', 'Porto Alegre', 'RS', 'Brasil', 50128),
('Mineirão', 'Belo Horizonte', 'MG', 'Brasil', 61927)
ON CONFLICT DO NOTHING; 