const axios = require('axios');

const EVOLUTION_API_URL = 'https://kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';

async function checkWebhook() {
    try {
        console.log('🔍 Verificando configuração atual do webhook...');
        
        const response = await axios.get(
            `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': API_KEY
                }
            }
        );
        
        console.log('📋 Configuração atual:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

checkWebhook(); 