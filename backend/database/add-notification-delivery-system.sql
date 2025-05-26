-- Script para adicionar sistema de controle de entrega de notificações
-- Execute este script no PostgreSQL para atualizar o banco de dados

-- 1. Adicionar novas colunas à tabela notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS send_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0;

-- 2. Criar enum para status de envio (se não existir)
DO $$ BEGIN
    CREATE TYPE notification_send_status AS ENUM ('draft', 'queued', 'sending', 'paused', 'completed', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Atualizar coluna send_status para usar o enum
ALTER TABLE notifications 
ALTER COLUMN send_status TYPE notification_send_status USING send_status::notification_send_status;

-- 4. Criar tabela notification_deliveries
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    whatsapp_message_id VARCHAR(255) NULL,
    error_message TEXT NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_notification_deliveries_notification 
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_deliveries_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Criar enum para status de entrega (se não existir)
DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'sending', 'delivered', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Atualizar coluna status da tabela notification_deliveries para usar o enum
ALTER TABLE notification_deliveries 
ALTER COLUMN status TYPE delivery_status USING status::delivery_status;

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id 
    ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id 
    ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status 
    ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notifications_send_status 
    ON notifications(send_status);

-- 8. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar trigger para atualizar updated_at na tabela notification_deliveries
DROP TRIGGER IF EXISTS update_notification_deliveries_updated_at ON notification_deliveries;
CREATE TRIGGER update_notification_deliveries_updated_at
    BEFORE UPDATE ON notification_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Atualizar notificações existentes para ter o status correto
UPDATE notifications 
SET send_status = CASE 
    WHEN is_sent = true THEN 'completed'::notification_send_status
    ELSE 'draft'::notification_send_status
END
WHERE send_status = 'draft';

COMMIT;

-- Verificar se tudo foi criado corretamente
SELECT 'Tabela notification_deliveries criada com sucesso' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_deliveries'
);

SELECT 'Colunas adicionadas à tabela notifications' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'send_status'
); 