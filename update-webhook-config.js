const axios = require('axios');

const EVOLUTION_API_URL = 'https://kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';
const WEBHOOK_URL = 'https://kmizabot.h4xd66.easypanel.host/chatbot/webhook';

async function updateWebhookConfig() {
    try {
        console.log('🔄 Atualizando configuração do webhook...');
        
        const webhookConfig = {
            url: WEBHOOK_URL,
            enabled: true,
            events: ['MESSAGES_UPSERT'],
            webhookByEvents: false,
            webhookBase64: false  // ⚠️ IMPORTANTE: Desabilitar base64
        };
        
        console.log('📋 Nova configuração:');
        console.log(JSON.stringify(webhookConfig, null, 2));
        
        const response = await axios.post(
            `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
            webhookConfig,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY
                }
            }
        );
        
        console.log('✅ Webhook atualizado com sucesso!');
        console.log('📊 Resposta:', response.data);
        
        // Verificar configuração
        console.log('\n🔍 Verificando nova configuração...');
        const checkResponse = await axios.get(
            `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': API_KEY
                }
            }
        );
        
        console.log('📋 Configuração atual:', checkResponse.data);
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

updateWebhookConfig(); 