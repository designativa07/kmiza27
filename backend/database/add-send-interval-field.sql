-- Migration: Add send_interval_ms field to notifications table
-- Date: 2025-05-25
-- Description: Adiciona campo para configurar intervalo entre envios de mensagens

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'send_interval_ms'
    ) THEN
        -- Adicionar a coluna send_interval_ms
        ALTER TABLE notifications 
        ADD COLUMN send_interval_ms INTEGER DEFAULT 1000 NOT NULL;
        
        -- Adicionar comentário na coluna
        COMMENT ON COLUMN notifications.send_interval_ms IS 'Intervalo entre envios em milissegundos';
        
        -- Atualizar registros existentes com valor padrão
        UPDATE notifications 
        SET send_interval_ms = 1000 
        WHERE send_interval_ms IS NULL;
        
        RAISE NOTICE 'Campo send_interval_ms adicionado com sucesso à tabela notifications';
    ELSE
        RAISE NOTICE 'Campo send_interval_ms já existe na tabela notifications';
    END IF;
END $$;

-- Verificar se a migration foi aplicada corretamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'send_interval_ms'; 