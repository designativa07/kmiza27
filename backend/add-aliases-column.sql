-- Adicionar campo aliases na tabela teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS aliases jsonb;

-- Inserir alguns aliases de exemplo para times conhecidos
UPDATE teams SET aliases = '["fogão", "fogao", "estrela", "solitária", "solitaria"]'::jsonb WHERE name = 'Botafogo';
UPDATE teams SET aliases = '["mengão", "mengao", "fla"]'::jsonb WHERE name = 'Flamengo';
UPDATE teams SET aliases = '["vascão", "vascao"]'::jsonb WHERE name = 'Vasco';
UPDATE teams SET aliases = '["verdão", "verdao"]'::jsonb WHERE name = 'Palmeiras';
UPDATE teams SET aliases = '["timão", "timao"]'::jsonb WHERE name = 'Corinthians';
UPDATE teams SET aliases = '["são paulo", "sao paulo", "spfc"]'::jsonb WHERE name = 'São Paulo';
UPDATE teams SET aliases = '["peixe"]'::jsonb WHERE name = 'Santos'; 