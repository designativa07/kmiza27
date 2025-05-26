const axios = require('axios');

async function testPortConfig() {
    console.log('🔍 Testando configuração de porta no Easypanel...');
    console.log('=' .repeat(60));
    
    const tests = [
        {
            name: 'Página Principal',
            url: 'https://kmiza27-kmizabot.h4xd66.easypanel.host',
            expected: 'Deve retornar a página principal ou API'
        },
        {
            name: 'Health Check',
            url: 'https://kmiza27-kmizabot.h4xd66.easypanel.host/health',
            expected: 'Deve retornar status: ok'
        },
        {
            name: 'API Base',
            url: 'https://kmiza27-kmizabot.h4xd66.easypanel.host/api',
            expected: 'Pode retornar 404 (normal se não tiver rota /api)'
        },
        {
            name: 'Webhook Endpoint',
            url: 'https://kmiza27-kmizabot.h4xd66.easypanel.host/chatbot/webhook',
            expected: 'Deve aceitar POST (pode dar erro em GET)'
        },
        {
            name: 'Porta 3000 Direta (NÃO deve funcionar)',
            url: 'https://kmiza27-kmizabot.h4xd66.easypanel.host:3000',
            expected: 'Deve falhar - porta interna não exposta'
        }
    ];
    
    for (const test of tests) {
        console.log(`\n🧪 ${test.name}`);
        console.log(`🔗 URL: ${test.url}`);
        console.log(`📋 Esperado: ${test.expected}`);
        
        try {
            const response = await axios.get(test.url, { 
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 600; // Aceitar qualquer status < 600
                }
            });
            
            console.log(`✅ Status: ${response.status} - ${response.statusText}`);
            
            if (response.status === 200 && response.data) {
                const preview = JSON.stringify(response.data).substring(0, 150);
                console.log(`📊 Resposta: ${preview}${preview.length >= 150 ? '...' : ''}`);
            }
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ Conexão recusada - Container não está rodando`);
            } else if (error.code === 'ETIMEDOUT') {
                console.log(`⏱️ Timeout - Container pode estar iniciando`);
            } else if (error.response) {
                console.log(`⚠️ Status: ${error.response.status} - ${error.response.statusText}`);
                
                if (error.response.status === 502) {
                    console.log(`🔧 Erro 502: Problema de configuração de porta!`);
                }
            } else {
                console.log(`❌ Erro: ${error.message}`);
            }
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 Diagnóstico:');
    
    console.log('\n🎯 Se todos retornaram 502:');
    console.log('   → Container não está rodando na porta 3000');
    console.log('   → Verificar configuração de porta no Easypanel');
    console.log('   → Verificar logs do container');
    
    console.log('\n✅ Se /health retornou 200:');
    console.log('   → Aplicação está funcionando!');
    console.log('   → Configuração de porta está correta');
    
    console.log('\n🔧 Próximos passos se houver erro 502:');
    console.log('   1. No Easypanel: App Settings → Port: 3000');
    console.log('   2. Verificar variável PORT=3000');
    console.log('   3. Rebuild/Restart o container');
    console.log('   4. Verificar logs para erros de inicialização');
}

testPortConfig(); 