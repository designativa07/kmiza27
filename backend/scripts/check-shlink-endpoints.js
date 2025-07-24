const fetch = require('node-fetch');

// Configurações do Shlink
const SHLINK_API_URL = process.env.SHLINK_API_URL || 'https://kmiza27-shlink.h4xd66.easypanel.host';
const SHLINK_API_KEY = process.env.SHLINK_API_KEY || '87b73696-cfb3-416f-9d4d-238b367a7d52';

async function checkEndpoints() {
  try {
    console.log('🔧 Verificando endpoints disponíveis no Shlink...');
    console.log(`📡 API URL: ${SHLINK_API_URL}`);

    // Testar diferentes endpoints
    const endpoints = [
      '/rest/v3/short-urls',
      '/rest/v3/domains',
      '/rest/v3/servers',
      '/rest/v3/tags',
      '/rest/v3/visits',
      '/rest/v3/health',
      '/rest/v3/options',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SHLINK_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'X-Api-Key': SHLINK_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Disponível - ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`${endpoint}: ❌ Erro - ${error.message}`);
      }
    }

    // Verificar se podemos criar URLs curtas
    console.log('\n🔗 Testando criação de URL curta...');
    const testResponse = await fetch(`${SHLINK_API_URL}/rest/v3/short-urls`, {
      method: 'POST',
      headers: {
        'X-Api-Key': SHLINK_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        longUrl: 'https://futepedia.kmiza27.com/jogos-hoje',
        customSlug: 'test-hoje',
        title: 'Teste - Jogos de Hoje',
        tags: ['teste']
      })
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Criação de URL curta funcionando');
      console.log(`   URL criada: ${testData.shortUrl}`);
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ Erro ao criar URL curta: ${testResponse.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar endpoints:', error);
  }
}

// Executar o script
checkEndpoints(); 