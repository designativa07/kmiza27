const axios = require('axios');

const EVOLUTION_API_URL = 'https://kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';
const EASYPANEL_DOMAIN = 'https://kmiza27-kmizabot.h4xd66.easypanel.host';

async function updateWebhook() {
    try {
        console.log('🔄 Atualizando webhook para Easypanel...');
        
        // Primeiro, vamos obter o ID do webhook atual
        const currentConfig = await axios.get(
            `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': API_KEY
                }
            }
        );
        
        const webhookId = currentConfig.data.id;
        console.log(`📋 Webhook ID atual: ${webhookId}`);
        
        const newWebhookUrl = `${EASYPANEL_DOMAIN}/chatbot/webhook`;
        console.log(`🔗 Nova URL: ${newWebhookUrl}`);
        
        // Tentar diferentes endpoints para atualizar
        const endpoints = [
            `/webhook/${webhookId}`,
            `/webhook/update/${INSTANCE_NAME}`,
            `/webhook/${INSTANCE_NAME}`,
            `/instance/webhook/${INSTANCE_NAME}`
        ];
        
        const updateData = {
            url: newWebhookUrl,
            enabled: true,
            events: ['MESSAGES_UPSERT'],
            webhookByEvents: false,
            webhookBase64: false
        };
        
        for (const endpoint of endpoints) {
            try {
                console.log(`\n🧪 Testando endpoint: ${endpoint}`);
                
                const response = await axios.patch(
                    `${EVOLUTION_API_URL}${endpoint}`,
                    updateData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': API_KEY
                        }
                    }
                );
                
                console.log('✅ Webhook atualizado com sucesso!');
                console.log('📊 Resposta:', response.data);
                return;
                
            } catch (error) {
                console.log(`❌ Falhou: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            }
        }
        
        // Se nenhum endpoint funcionou, vamos tentar recriar
        console.log('\n🔄 Tentando recriar webhook...');
        
        try {
            const response = await axios.post(
                `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
                updateData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': API_KEY
                    }
                }
            );
            
            console.log('✅ Webhook recriado com sucesso!');
            console.log('📊 Resposta:', response.data);
            
        } catch (error) {
            console.error('❌ Erro ao recriar webhook:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

updateWebhook(); 