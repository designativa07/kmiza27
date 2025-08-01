const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function resetMenuWithFavoriteTeam() {
  console.log('🔄 Resetando menu para incluir comandos de Time Favorito...\n');

  try {
    // Resetar menu para padrão (que agora inclui os comandos de time favorito)
    console.log('📋 Resetando menu para configuração padrão...');
    const resetResponse = await axios.post(`${BASE_URL}/whatsapp-menu/reset-default`);
    
    if (resetResponse.data) {
      console.log('✅ Menu resetado com sucesso!');
      console.log('\n📱 Novos comandos disponíveis:');
      console.log('   ❤️ Definir Time Favorito');
      console.log('   📊 Resumo do Meu Time');
      console.log('   🔄 Alterar Time Favorito');
      console.log('   ❌ Remover Time Favorito');
      console.log('\n🎉 Menu atualizado com funcionalidade de Time Favorito!');
    }

  } catch (error) {
    console.error('❌ Erro ao resetar menu:', error.response?.data || error.message);
  }
}

// Executar script
resetMenuWithFavoriteTeam(); 