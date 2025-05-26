const axios = require('axios');

// 🌐 Configuração do Webhook com Domínio Personalizado
const EVOLUTION_API_URL = 'https://kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';

// ⚠️ ALTERE AQUI PARA SEU DOMÍNIO PERSONALIZADO
const CUSTOM_DOMAIN = 'https://SEU_DOMINIO_AQUI.com'; // Ex: https://chatbot.meusite.com

async function configureWebhookCustomDomain() {
    try {
        console.log('🌐 Configurando webhook com domínio personalizado...');
        console.log(`📡 Evolution API: ${EVOLUTION_API_URL}`);
        console.log(`🤖 Instância: ${INSTANCE_NAME}`);
        console.log(`🔗 Domínio personalizado: ${CUSTOM_DOMAIN}`);
        
        const webhookUrl = `${CUSTOM_DOMAIN}/chatbot/webhook`;
        
        const webhookConfig = {
            webhook: {
                url: webhookUrl,
                events: [
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'MESSAGES_DELETE',
                    'SEND_MESSAGE',
                    'CONNECTION_UPDATE',
                    'PRESENCE_UPDATE',
                    'CHATS_UPSERT',
                    'CHATS_UPDATE',
                    'CHATS_DELETE',
                    'CONTACTS_UPSERT',
                    'CONTACTS_UPDATE',
                    'GROUPS_UPSERT',
                    'GROUPS_UPDATE',
                    'GROUP_PARTICIPANTS_UPDATE'
                ],
                webhook_by_events: false,
                webhook_base64: false
            }
        };

        console.log('\n📋 Configuração do webhook:');
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

        console.log('\n✅ Webhook configurado com sucesso!');
        console.log('📊 Resposta:', response.data);
        
        // Verificar configuração
        console.log('\n🔍 Verificando configuração...');
        const checkResponse = await axios.get(
            `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': API_KEY
                }
            }
        );
        
        console.log('📋 Configuração atual:', checkResponse.data);
        
        console.log('\n🎯 Próximos passos:');
        console.log('1. Configure o DNS do seu domínio');
        console.log('2. Aguarde a propagação DNS (até 24h)');
        console.log('3. Teste o webhook com uma mensagem no WhatsApp');
        console.log(`4. Verifique os logs em: ${CUSTOM_DOMAIN}/health`);

    } catch (error) {
        console.error('❌ Erro ao configurar webhook:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n🔑 Verifique se a API Key está correta');
        } else if (error.response?.status === 404) {
            console.log('\n🤖 Verifique se a instância existe e está ativa');
        }
    }
}

// Executar configuração
configureWebhookCustomDomain(); 