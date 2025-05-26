-- Script para criar a tabela bot_configs
CREATE TABLE IF NOT EXISTS bot_configs (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(500),
    type VARCHAR(50) DEFAULT 'string',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO bot_configs (key, value, description, type) VALUES 
('openai_prompt', 'Você é um assistente especializado em futebol brasileiro. Sua função é ajudar usuários com informações sobre:

- Próximos jogos dos times
- Resultados de partidas
- Classificações de campeonatos
- Notícias do futebol
- Escalações dos times

Responda sempre de forma amigável, usando emojis relacionados ao futebol. Quando o usuário mencionar apenas o nome de um time (como "Flamengo"), assuma que ele quer saber sobre o próximo jogo desse time.

Mantenha as respostas concisas e informativas.', 'Prompt principal para o OpenAI processar mensagens', 'text'),

('auto_response_enabled', 'true', 'Habilitar respostas automáticas do bot', 'boolean'),

('confidence_threshold', '0.7', 'Limite mínimo de confiança para responder automaticamente', 'number'),

('welcome_message', '👋 **Olá! Sou o Kmiza27 Bot** ⚽

🤖 Posso te ajudar com informações sobre futebol:

⚽ **Próximos jogos** - "Próximo jogo do Flamengo"
ℹ️ **Info do time** - "Informações do Palmeiras"  
📊 **Tabelas** - "Tabela do Brasileirão"
📅 **Jogos hoje** - "Jogos de hoje"
🏆 **Competições** - "Copa Libertadores"

💬 **O que você gostaria de saber?**', 'Mensagem de boas-vindas do bot', 'text')

ON CONFLICT (key) DO NOTHING; 