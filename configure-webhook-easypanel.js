#!/usr/bin/env node

/**
 * 🔧 Configurador de Webhook para Easypanel - kmiza27-chatbot
 * Configura o webhook da Evolution API para produção no Easypanel
 */

const axios = require('axios');

// 🚀 Configuração do Webhook para Easypanel
const EVOLUTION_API_URL = 'https://kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';

// 🌐 Domínio do Easypanel (atual)
const EASYPANEL_DOMAIN = 'https://kmiza27-kmizabot.h4xd66.easypanel.host';

async function configureWebhookEasypanel() {
    try {
        console.log('🚀 Configurando webhook para Easypanel...');
        console.log(`📡 Evolution API: ${EVOLUTION_API_URL}`);
        console.log(`🤖 Instância: ${INSTANCE_NAME}`);
        console.log(`🌐 Domínio Easypanel: ${EASYPANEL_DOMAIN}`);
        
        const webhookUrl = `${EASYPANEL_DOMAIN}/chatbot/webhook`;
        
        const webhookConfig = {
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
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
            ]
        };

        console.log('\n📋 Configuração do webhook:');
        console.log(JSON.stringify(webhookConfig, null, 2));

        const response = await axios.patch(
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
        
        // Testar endpoint
        console.log('\n🧪 Testando endpoint...');
        try {
            const testResponse = await axios.get(`${EASYPANEL_DOMAIN}/health`);
            console.log('✅ Endpoint acessível:', testResponse.status);
        } catch (testError) {
            console.log('⚠️ Endpoint não acessível ainda, mas webhook configurado');
        }
        
        console.log('\n🎯 Configuração completa!');
        console.log('📱 Agora você pode testar enviando uma mensagem no WhatsApp');
        console.log(`🔗 Webhook URL: ${webhookUrl}`);
        console.log(`🌐 App URL: ${EASYPANEL_DOMAIN}`);

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
configureWebhookEasypanel();

module.exports = { configureWebhookEasypanel }; 