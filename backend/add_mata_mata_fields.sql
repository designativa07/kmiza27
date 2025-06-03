-- Migração manual para adicionar campos de mata-mata à tabela matches
-- Execute este script no seu banco de dados PostgreSQL

-- Adicionar campo 'leg' para indicar se é jogo de ida (1) ou volta (2)
ALTER TABLE matches ADD COLUMN leg integer;

-- Adicionar campo 'tie_id' para agrupar jogos de ida e volta do mesmo confronto
ALTER TABLE matches ADD COLUMN tie_id uuid;

-- Adicionar campos para placar agregado
ALTER TABLE matches ADD COLUMN home_aggregate_score integer;
ALTER TABLE matches ADD COLUMN away_aggregate_score integer;

-- Adicionar campo para o time classificado
ALTER TABLE matches ADD COLUMN qualified_team_id integer;

-- Adicionar constraint de foreign key para o time classificado
ALTER TABLE matches ADD CONSTRAINT fk_matches_qualified_team 
    FOREIGN KEY (qualified_team_id) REFERENCES teams(id);

-- Comentários para documentação
COMMENT ON COLUMN matches.leg IS 'Indica se é jogo de ida (1) ou volta (2) em confrontos mata-mata';
COMMENT ON COLUMN matches.tie_id IS 'UUID que agrupa jogos de ida e volta do mesmo confronto';
COMMENT ON COLUMN matches.home_aggregate_score IS 'Placar agregado do time mandante (soma dos dois jogos)';
COMMENT ON COLUMN matches.away_aggregate_score IS 'Placar agregado do time visitante (soma dos dois jogos)';
COMMENT ON COLUMN matches.qualified_team_id IS 'ID do time que se classificou após o confronto'; 