-- Adicionar campo regulamento na tabela competitions
ALTER TABLE competitions 
ADD COLUMN regulamento TEXT;

-- Registrar a migration
INSERT INTO typeorm_migrations (timestamp, name) 
VALUES (1751450000000, 'AddRegulamentoToCompetitions1751450000000')
ON CONFLICT (timestamp) DO NOTHING; 