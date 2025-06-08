const axios = require('axios');

async function debugBroadcastChannels() {
  console.log('🔍 DEBUG - Verificando coluna broadcast_channels');
  console.log('='.repeat(60));
  
  try {
    // Teste específico para o jogo CRB
    console.log('\n📺 Testando resposta do chatbot para CRB:');
    const chatResponse = await axios.post('https://kmizabot.h4xd66.easypanel.host/chatbot/test/message', {
      message: 'crb'
    });
    
    console.log('Resposta do chatbot:');
    console.log(chatResponse.data.output.response);
    
    // Verificar se contém o link do YouTube
    const hasYouTubeLink = chatResponse.data.output.response.includes('NPIHuI60who');
    const hasYouTubeDomain = chatResponse.data.output.response.includes('youtube.com');
    
    console.log('\n📊 Análise:');
    console.log(`✅ Contém link específico (NPIHuI60who): ${hasYouTubeLink}`);
    console.log(`✅ Contém domínio YouTube: ${hasYouTubeDomain}`);
    
    // Extrair linha de transmissão
    const lines = chatResponse.data.output.response.split('\n');
    const transmissionLine = lines.find(line => line.includes('📺 Transmissão:'));
    
    if (transmissionLine) {
      console.log(`\n📺 Linha de transmissão completa:`);
      console.log(`"${transmissionLine}"`);
      
      // Verificar quantos canais estão sendo exibidos
      const transmissionText = transmissionLine.replace('📺 Transmissão: ', '');
      const channels = transmissionText.split(', ');
      
      console.log(`\n📊 Canais encontrados: ${channels.length}`);
      channels.forEach((channel, index) => {
        console.log(`  ${index + 1}. "${channel}"`);
      });
    }
    
    // Verificar se há links de streaming separados
    const streamingLines = lines.filter(line => line.includes('🔗'));
    console.log(`\n🔗 Links de streaming separados: ${streamingLines.length}`);
    streamingLines.forEach((line, index) => {
      console.log(`  ${index + 1}. "${line}"`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CONCLUSÃO:');
    
    if (hasYouTubeLink) {
      console.log('✅ Link do YouTube está sendo exibido corretamente!');
    } else {
      console.log('❌ Link do YouTube NÃO está sendo exibido.');
      console.log('💡 Possíveis causas:');
      console.log('   1. Link não está salvo na coluna broadcast_channels');
      console.log('   2. Formato do dado na coluna não está sendo processado');
      console.log('   3. Link está em outro campo (streaming_links)');
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    if (error.response) {
      console.error('📝 Resposta do servidor:', error.response.data);
    }
  }
}

// Executar debug
debugBroadcastChannels(); 