const axios = require('axios');

const EASYPANEL_DOMAIN = 'https://kmiza27-kmizabot.h4xd66.easypanel.host';

async function testEasypanelStatus() {
    console.log('🔍 Diagnosticando erro 502 no Easypanel...');
    console.log(`🌐 Testando: ${EASYPANEL_DOMAIN}`);
    
    const endpoints = [
        '/',
        '/health',
        '/api',
        '/chatbot/webhook'
    ];
    
    for (const endpoint of endpoints) {
        const url = `${EASYPANEL_DOMAIN}${endpoint}`;
        
        try {
            console.log(`\n🧪 Testando: ${endpoint}`);
            
            const response = await axios.get(url, {
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 600; // Aceitar qualquer status < 600
                }
            });
            
            console.log(`✅ Status: ${response.status}`);
            
            if (response.status === 200) {
                console.log(`📊 Resposta: ${JSON.stringify(response.data).substring(0, 200)}...`);
            } else {
                console.log(`⚠️ Erro: ${response.status} - ${response.statusText}`);
            }
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ Conexão recusada - Container não está rodando`);
            } else if (error.code === 'ETIMEDOUT') {
                console.log(`⏱️ Timeout - Container pode estar iniciando`);
            } else if (error.response) {
                console.log(`❌ Status: ${error.response.status} - ${error.response.statusText}`);
            } else {
                console.log(`❌ Erro: ${error.message}`);
            }
        }
    }
    
    console.log('\n📋 Possíveis causas do erro 502:');
    console.log('1. 🐳 Container não está rodando');
    console.log('2. 🔧 Aplicação não iniciou corretamente');
    console.log('3. 🚪 Porta incorreta (deve ser 3000)');
    console.log('4. 💾 Falta de recursos (RAM/CPU)');
    console.log('5. 🗄️ Problema de conexão com banco de dados');
    
    console.log('\n🔧 Soluções recomendadas:');
    console.log('1. Verificar logs no Easypanel');
    console.log('2. Reiniciar o container');
    console.log('3. Verificar variáveis de ambiente');
    console.log('4. Verificar se o build foi bem-sucedido');
}

testEasypanelStatus(); 