const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function addFavoriteTeamMenu() {
  console.log('📋 Adicionando comandos de Time Favorito ao menu...\n');

  const menuConfigs = [
    // Seção: Meu Time Favorito
    {
      section_id: 'meu_time_favorito',
      section_title: '❤️ Meu Time Favorito',
      section_order: 5,
      item_id: 'CMD_DEFINIR_TIME_FAVORITO',
      item_title: '❤️ Definir Time Favorito',
      item_description: 'Escolher seu time favorito',
      item_order: 1,
      active: true
    },
    {
      section_id: 'meu_time_favorito',
      section_title: '❤️ Meu Time Favorito',
      section_order: 5,
      item_id: 'CMD_MEU_TIME_FAVORITO',
      item_title: '📊 Resumo do Meu Time',
      item_description: 'Ver resumo do seu time favorito',
      item_order: 2,
      active: true
    },
    {
      section_id: 'meu_time_favorito',
      section_title: '❤️ Meu Time Favorito',
      section_order: 5,
      item_id: 'CMD_ALTERAR_TIME_FAVORITO',
      item_title: '🔄 Alterar Time Favorito',
      item_description: 'Trocar seu time favorito',
      item_order: 3,
      active: true
    },
    {
      section_id: 'meu_time_favorito',
      section_title: '❤️ Meu Time Favorito',
      section_order: 5,
      item_id: 'CMD_REMOVER_TIME_FAVORITO',
      item_title: '❌ Remover Time Favorito',
      item_description: 'Remover time favorito',
      item_order: 4,
      active: true
    }
  ];

  try {
    for (const config of menuConfigs) {
      console.log(`➕ Adicionando: ${config.item_title}`);
      
      const response = await axios.post(`${BASE_URL}/whatsapp-menu/configs`, config);
      
      if (response.data) {
        console.log(`✅ Adicionado com sucesso: ${config.item_title}`);
      }
    }

    console.log('\n🎉 Todos os comandos de Time Favorito foram adicionados ao menu!');
    console.log('\n📱 Agora os usuários podem:');
    console.log('   • Definir seu time favorito');
    console.log('   • Ver resumo personalizado do time');
    console.log('   • Alterar o time favorito');
    console.log('   • Remover o time favorito');

  } catch (error) {
    console.error('❌ Erro ao adicionar comandos:', error.response?.data || error.message);
  }
}

// Executar script
addFavoriteTeamMenu(); 