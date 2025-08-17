-- =====================================================
-- ADICIONAR TABELA DE NOTIFICAÇÕES DO MERCADO
-- =====================================================

-- Criar tabela de notificações do mercado
CREATE TABLE IF NOT EXISTS market_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('offer_received', 'offer_accepted', 'offer_rejected', 'player_sold', 'player_bought')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_market_notifications_team_id ON market_notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_market_notifications_read ON market_notifications(read);
CREATE INDEX IF NOT EXISTS idx_market_notifications_created_at ON market_notifications(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_market_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se existir e criar novamente
DROP TRIGGER IF EXISTS trigger_update_market_notifications_updated_at ON market_notifications;
CREATE TRIGGER trigger_update_market_notifications_updated_at
    BEFORE UPDATE ON market_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_market_notifications_updated_at();

-- Inserir algumas notificações de teste (opcional)
-- INSERT INTO market_notifications (team_id, type, title, message, data) VALUES
-- ('SEU_TEAM_ID_AQUI', 'offer_received', 'Nova Oferta Recebida', 'Você recebeu uma oferta de R$ 5.000 pelo jogador João Silva', '{"player_id": "123", "offer_price": 5000}');
