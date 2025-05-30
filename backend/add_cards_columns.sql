-- Adicionar colunas de cartões se não existirem
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS home_yellow_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_yellow_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS home_red_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_red_cards INTEGER DEFAULT 0;

-- Adicionar coluna de critérios de desempate se não existir
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS tiebreaker_criteria JSONB; 