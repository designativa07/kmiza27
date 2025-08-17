const fetch = require('node-fetch');

async function testAPINotifications() {
  try {
    console.log('🧪 Testando API de notificações...');
    
    const backendUrl = 'http://localhost:3004';
    const teamId = 'dc48e450-2e94-42dd-a037-ea139e84dd12'; // Time que tem notificações
    
    // Testar endpoint de notificações
    console.log(`\n🔍 Testando endpoint /api/v2/market/notifications?teamId=${teamId}...`);
    
    const response = await fetch(`${backendUrl}/api/v2/market/notifications?teamId=${teamId}`);
    
    console.log(`📊 Resposta da API:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso! Dados recebidos:');
      console.log(JSON.stringify(data, null, 2));
      
      if (Array.isArray(data)) {
        console.log(`\n📋 Total de notificações: ${data.length}`);
        data.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title} - ${notif.message}`);
        });
      }
    } else {
      console.log('❌ Erro na resposta');
      try {
        const errorText = await response.text();
        console.log('📄 Corpo da resposta de erro:');
        console.log(errorText);
      } catch (readError) {
        console.log('⚠️  Não foi possível ler o corpo da resposta de erro');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('   Stack:', error.stack);
  }
}

// Executar teste
testAPINotifications()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
