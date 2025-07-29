-- Script para corrigir a coluna player_name na tabela goals

-- 1. Verificar se a coluna player_name existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'player_name'
    ) THEN
        ALTER TABLE goals ADD COLUMN player_name VARCHAR(255) NOT NULL DEFAULT 'Jogador Desconhecido';
    END IF;
END $$;

-- 2. Atualizar gols existentes que têm player_name NULL
UPDATE goals 
SET player_name = COALESCE(
    (SELECT name FROM players WHERE players.id = goals.player_id),
    'Jogador Desconhecido'
)
WHERE player_name IS NULL OR player_name = '';

-- 3. Adicionar comentário
COMMENT ON COLUMN goals.player_name IS 'Nome do jogador que marcou o gol';

-- 4. Verificar se há gols sem player_name
SELECT COUNT(*) as gols_sem_player_name 
FROM goals 
WHERE player_name IS NULL OR player_name = ''; 