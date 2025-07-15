-- Script para adicionar configuração de descrição do menu
INSERT INTO bot_configs (key, value, description, type) VALUES 
('menu_description', 'Selecione uma das opções abaixo para começar:', 'Descrição exibida no menu interativo do WhatsApp', 'text')
ON CONFLICT (key) DO NOTHING; 