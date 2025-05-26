#!/usr/bin/env node

/**
 * 🧪 Teste de Deploy no Easypanel - kmiza27-chatbot
 * Testa se o deploy no Easypanel está funcionando corretamente
 */

const axios = require('axios');

// Configurações
const BACKEND_URL = process.env.BACKEND_URL || 'https://seu-dominio.com';
const EVOLUTION_CONFIG = {
    serverUrl: process.env.EVOLUTION_API_URL || 'https://kmiza27-evolution.h4xd66.easypanel.host',
    apiKey: process.env.EVOLUTION_API_KEY || '95DC243F41B2-4858-B0F1-FF49D8C46A85',
    instance: process.env.EVOLUTION_INSTANCE || 'kmizabot'
};

async function testDeployment() {
    console.log('🧪 Testando deploy no Easypanel...');
    console.log('=' .repeat(50));
    
    // 1. Testar Health Check
    await testHealthCheck();
    
    // 2. Testar API Endpoints
    await testApiEndpoints();
    
    // 3. Testar Webhook
    await testWebhook();
    
    // 4. Testar Conexão WhatsApp
    await testWhatsAppConnection();
    
    console.log('\n🎉 Teste completo finalizado!');
}

async function testHealthCheck() {
    try {
        console.log('\n🔍 1. Testando Health Check...');
        
        const response = await axios.get(`${BACKEND_URL}/health`, {
            timeout: 10000
        });
        
        console.log('✅ Health Check OK:', response.status);
        console.log('📋 Resposta:', response.data);
        
    } catch (error) {
        console.error('❌ Health Check falhou:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Verifique se o backend está rodando no Easypanel');
        }
    }
}

async function testApiEndpoints() {
    console.log('\n🔍 2. Testando API Endpoints...');
    
    const endpoints = [
        '/store/products',
        '/teams',
        '/competitions'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
                timeout: 5000
            });
            
            console.log(`✅ ${endpoint}: ${response.status}`);
            
        } catch (error) {
            console.error(`❌ ${endpoint}: ${error.message}`);
        }
    }
}

async function testWebhook() {
    try {
        console.log('\n🔍 3. Testando Webhook...');
        
        // Simular uma mensagem de webhook
        const webhookData = {
            key: {
                remoteJid: "5511999999999@s.whatsapp.net",
                fromMe: false,
                id: "test_message_id"
            },
            message: {
                conversation: "teste"
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
            pushName: "Teste",
            broadcast: false
        };
        
        const response = await axios.post(`${BACKEND_URL}/chatbot/webhook`, {
            data: webhookData,
            type: "messages.upsert"
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Webhook respondeu:', response.status);
        
    } catch (error) {
        console.error('❌ Webhook falhou:', error.message);
        console.error('💡 Verifique se o endpoint /chatbot/webhook está configurado');
    }
}

async function testWhatsAppConnection() {
    try {
        console.log('\n🔍 4. Testando Conexão WhatsApp...');
        
        const response = await axios.get(
            `${EVOLUTION_CONFIG.serverUrl}/instance/connectionState/${EVOLUTION_CONFIG.instance}`,
            {
                headers: {
                    'apikey': EVOLUTION_CONFIG.apiKey
                },
                timeout: 10000
            }
        );
        
        const status = response.data;
        console.log('📱 Status da instância:', status);
        
        if (status.instance?.state === 'open') {
            console.log('✅ WhatsApp conectado!');
        } else {
            console.log('⚠️ WhatsApp não conectado. Estado:', status.instance?.state);
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar WhatsApp:', error.message);
    }
}

async function testChatbotResponse() {
    try {
        console.log('\n🔍 5. Testando Resposta do Chatbot...');
        
        const testMessage = {
            phone: "5511999999999",
            message: "Palmeiras"
        };
        
        const response = await axios.post(`${BACKEND_URL}/chatbot/test-message`, testMessage, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log('✅ Chatbot respondeu:', response.status);
        console.log('🤖 Resposta:', response.data);
        
    } catch (error) {
        console.error('❌ Chatbot não respondeu:', error.message);
    }
}

// Validar variáveis de ambiente
function validateEnvironment() {
    console.log('🔧 Configurações:');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`📱 Evolution API: ${EVOLUTION_CONFIG.serverUrl}`);
    console.log(`🤖 Instance: ${EVOLUTION_CONFIG.instance}`);
    
    if (BACKEND_URL === 'https://seu-dominio.com') {
        console.log('\n⚠️ Configure a variável BACKEND_URL:');
        console.log('export BACKEND_URL="https://sua-url-easypanel.com"');
    }
}

// Executar testes
if (require.main === module) {
    console.log('🚀 kmiza27-chatbot - Teste de Deploy Easypanel');
    console.log('=' .repeat(50));
    
    validateEnvironment();
    testDeployment().catch(console.error);
}

module.exports = { 
    testDeployment, 
    testHealthCheck, 
    testApiEndpoints, 
    testWebhook, 
    testWhatsAppConnection 
}; 