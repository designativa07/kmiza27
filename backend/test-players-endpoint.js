const fetch = require('node-fetch');

async function testPlayersEndpoint() {
  try {
    console.log('🔍 Testando endpoint /teams/7/players...');
    
    const response = await fetch('https://kmizabot.h4xd66.easypanel.host/teams/7/players');
    
    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      console.error('❌ Erro na requisição:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos:');
    console.log('📄 Estrutura dos dados:', JSON.stringify(data, null, 2));
    console.log('🔢 Quantidade de jogadores:', data.length);
    
    if (data.length > 0) {
      console.log('👤 Primeiro jogador:', data[0]);
      console.log('🔍 Tem propriedade "player"?', !!data[0].player);
      console.log('🔍 Tem propriedade "id" no jogador?', !!data[0].player?.id);
    }
    
  } catch (error) {
    console.error('💥 Erro ao testar endpoint:', error);
  }
}

testPlayersEndpoint(); 