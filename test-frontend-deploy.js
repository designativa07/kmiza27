const axios = require('axios');

async function testFrontendDeploy() {
    console.log('🧪 Testando deploy completo Frontend + Backend...');
    console.log('=' .repeat(60));
    
    const frontendUrl = 'https://kmiza27-frontend.h4xd66.easypanel.host';
    const backendUrl = 'https://kmiza27-kmizabot.h4xd66.easypanel.host';
    
    const tests = [
        {
            name: 'Frontend - Página Principal',
            url: frontendUrl,
            expected: 'Next.js app funcionando'
        },
        {
            name: 'Backend - Health Check',
            url: `${backendUrl}/health`,
            expected: 'API funcionando'
        },
        {
            name: 'Backend - API Base',
            url: backendUrl,
            expected: 'NestJS welcome message'
        },
        {
            name: 'Backend - Teams API',
            url: `${backendUrl}/teams`,
            expected: 'Lista de times'
        },
        {
            name: 'Backend - Webhook',
            url: `${backendUrl}/chatbot/webhook`,
            expected: 'Webhook endpoint (pode dar erro em GET)'
        }
    ];
    
    let frontendWorking = false;
    let backendWorking = false;
    
    for (const test of tests) {
        console.log(`\n🧪 ${test.name}`);
        console.log(`🔗 URL: ${test.url}`);
        console.log(`📋 Esperado: ${test.expected}`);
        
        try {
            const response = await axios.get(test.url, { 
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 600;
                }
            });
            
            console.log(`✅ Status: ${response.status} - ${response.statusText}`);
            
            if (response.status === 200) {
                if (test.url.includes('frontend')) {
                    frontendWorking = true;
                } else if (test.url.includes('kmizabot')) {
                    backendWorking = true;
                }
                
                if (response.data) {
                    const preview = JSON.stringify(response.data).substring(0, 100);
                    console.log(`📊 Resposta: ${preview}${preview.length >= 100 ? '...' : ''}`);
                }
            }
            
        } catch (error) {
            if (error.response) {
                console.log(`⚠️ Status: ${error.response.status} - ${error.response.statusText}`);
                
                if (error.response.status === 502) {
                    console.log(`🔧 Erro 502: App não está rodando ou porta incorreta`);
                } else if (error.response.status === 404) {
                    console.log(`📝 404: Endpoint não existe (pode ser normal)`);
                }
            } else {
                console.log(`❌ Erro: ${error.message}`);
            }
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Resumo do Deploy:');
    
    console.log(`\n🎨 Frontend: ${frontendWorking ? '✅ Funcionando' : '❌ Com problemas'}`);
    console.log(`🔧 Backend: ${backendWorking ? '✅ Funcionando' : '❌ Com problemas'}`);
    
    if (frontendWorking && backendWorking) {
        console.log('\n🎉 Deploy completo funcionando!');
        console.log('📱 Agora você pode:');
        console.log('   1. Acessar o painel administrativo');
        console.log('   2. Configurar times e competições');
        console.log('   3. Testar o WhatsApp bot');
        console.log('   4. Monitorar notificações');
    } else {
        console.log('\n🔧 Problemas encontrados:');
        
        if (!frontendWorking) {
            console.log('   → Frontend não está acessível');
            console.log('   → Verificar build do Next.js');
            console.log('   → Verificar porta 3000 configurada');
        }
        
        if (!backendWorking) {
            console.log('   → Backend não está acessível');
            console.log('   → Verificar logs do container');
            console.log('   → Verificar configuração de porta');
        }
    }
    
    console.log('\n🌐 URLs para acessar:');
    console.log(`   Frontend: ${frontendUrl}`);
    console.log(`   Backend: ${backendUrl}`);
    console.log(`   API Docs: ${backendUrl}/api (se configurado)`);
}

testFrontendDeploy(); 