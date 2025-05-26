const axios = require('axios');

const EVOLUTION_API_URL = 'https://kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';
const EASYPANEL_DOMAIN = 'https://kmiza27-kmizabot.h4xd66.easypanel.host';

async function recreateWebhook() {
    try {
        console.log('🗑️ Removendo webhook atual...');
        
        // Tentar deletar o webhook atual
        try {
            await axios.delete(
                `${EVOLUTION_API_URL}/webhook/${INSTANCE_NAME}`,
                {
                    headers: {
                        'apikey': API_KEY
                    }
                }
            );
            console.log('✅ Webhook removido com sucesso!');
        } catch (deleteError) {
            console.log('⚠️ Erro ao remover webhook (pode não existir):', deleteError.response?.status);
        }
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n🔧 Criando novo webhook...');
        
        const newWebhookUrl = `${EASYPANEL_DOMAIN}/chatbot/webhook`;
        console.log(`🔗 URL: ${newWebhookUrl}`);
        
        const webhookConfig = {
            webhook: {
                url: newWebhookUrl,
                enabled: true,
                events: ['MESSAGES_UPSERT'],
                webhookByEvents: false,
                webhookBase64: false
            }
        };
        
        console.log('📋 Configuração:');
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
        
        console.log('\n✅ Webhook criado com sucesso!');
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
        
        console.log('📋 Nova configuração:', checkResponse.data);
        
        console.log('\n🎯 Webhook configurado para Easypanel!');
        console.log(`🌐 App: ${EASYPANEL_DOMAIN}`);
        console.log(`📱 Teste enviando uma mensagem no WhatsApp`);
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
        
        if (error.response?.data?.response?.message) {
            console.log('📝 Detalhes:', error.response.data.response.message);
        }
    }
}

recreateWebhook(); 