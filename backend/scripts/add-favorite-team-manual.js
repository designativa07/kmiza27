const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function addFavoriteTeamManual() {
  console.log('🔧 Adicionando configurações de Time Favorito manualmente...\n');

  try {
    // Configurações para a seção "Meu Time Favorito"
    const favoriteTeamConfigs = [
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

    console.log('📋 Adicionando configurações...');
    
    for (const config of favoriteTeamConfigs) {
      console.log(`  - Adicionando: ${config.item_title}`);
      const response = await axios.post(`${BASE_URL}/whatsapp-menu/configs`, config);
      
      if (response.data) {
        console.log(`    ✅ Sucesso: ${response.data.item_title}`);
      } else {
        console.log(`    ❌ Erro ao adicionar: ${config.item_title}`);
      }
    }

    console.log('\n✅ Configurações de Time Favorito adicionadas!');
    console.log('\n📱 Agora verifique o menu no WhatsApp:');
    console.log('   - Digite "menu"');
    console.log('   - Procure pela seção "❤️ Meu Time Favorito"');

  } catch (error) {
    console.error('❌ Erro ao adicionar configurações:', error.response?.data || error.message);
  }
}

// Executar script
addFavoriteTeamManual(); 