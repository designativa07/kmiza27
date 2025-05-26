-- Script para adicionar sistema de controle de entrega de notificações
-- Execute este script no PostgreSQL para atualizar o banco de dados

-- 1. Criar enum para status de envio (se não existir)
DO $$ BEGIN
    CREATE TYPE notification_send_status AS ENUM ('draft', 'queued', 'sending', 'paused', 'completed', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar enum para status de entrega (se não existir)
DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'sending', 'delivered', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Adicionar novas colunas à tabela notifications (se não existirem)
DO $$ BEGIN
    -- Verificar se a coluna send_status já existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'send_status') THEN
        ALTER TABLE notifications ADD COLUMN send_status notification_send_status DEFAULT 'draft';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'started_at') THEN
        ALTER TABLE notifications ADD COLUMN started_at TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'completed_at') THEN
        ALTER TABLE notifications ADD COLUMN completed_at TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'paused_at') THEN
        ALTER TABLE notifications ADD COLUMN paused_at TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'total_recipients') THEN
        ALTER TABLE notifications ADD COLUMN total_recipients INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'sent_count') THEN
        ALTER TABLE notifications ADD COLUMN sent_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'delivered_count') THEN
        ALTER TABLE notifications ADD COLUMN delivered_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'failed_count') THEN
        ALTER TABLE notifications ADD COLUMN failed_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Criar tabela notification_deliveries (se não existir)
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status delivery_status DEFAULT 'pending',
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

-- 5. Criar índices para melhor performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id 
    ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id 
    ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status 
    ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notifications_send_status 
    ON notifications(send_status);

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Criar trigger para atualizar updated_at na tabela notification_deliveries
DROP TRIGGER IF EXISTS update_notification_deliveries_updated_at ON notification_deliveries;
CREATE TRIGGER update_notification_deliveries_updated_at
    BEFORE UPDATE ON notification_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Atualizar notificações existentes para ter o status correto
UPDATE notifications 
SET send_status = CASE 
    WHEN is_sent = true THEN 'completed'::notification_send_status
    ELSE 'draft'::notification_send_status
END
WHERE send_status IS NULL OR send_status = 'draft';

-- Verificar se tudo foi criado corretamente
SELECT 'Sistema de delivery de notificações instalado com sucesso!' as status; 