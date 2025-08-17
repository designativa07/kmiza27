const fetch = require('node-fetch');

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testando endpoint da API diretamente...');

    const backendUrl = 'http://localhost:3004';
    const endpoint = '/api/v2/market/make-offer';

    // 1. Verificar se o backend está rodando
    console.log('\n🔍 Verificando se o backend está rodando...');
    try {
      const healthResponse = await fetch(`${backendUrl}/api/v2/health`);
      if (healthResponse.ok) {
        console.log('✅ Backend está rodando');
      } else {
        console.log('⚠️  Backend respondeu mas com status:', healthResponse.status);
      }
    } catch (error) {
      console.error('❌ Backend não está rodando:', error.message);
      return;
    }

    // 2. Testar o endpoint make-offer
    console.log('\n🔍 Testando endpoint make-offer...');
    
    const testData = {
      playerId: '6efd736b-8a02-4ef4-9f3d-a06825c13788',
      buyingTeamId: '01bac20e-e4cb-400a-85e9-46ffa3f2f4e7',
      offerPrice: 8000,
      isYouth: true
    };

    console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Resposta do backend:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Sucesso! Resposta:', JSON.stringify(responseData, null, 2));
    } else {
      console.log('❌ Erro na resposta');
      
      // Tentar ler o corpo da resposta para ver o erro
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
testAPIEndpoint()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
