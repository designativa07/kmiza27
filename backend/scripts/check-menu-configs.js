const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function checkMenuConfigs() {
  console.log('🔍 Verificando configurações do menu...\n');

  try {
    // 1. Verificar todas as configurações
    console.log('1️⃣ Buscando todas as configurações...');
    const allConfigsResponse = await axios.get(`${BASE_URL}/whatsapp-menu/configs`);
    const allConfigs = allConfigsResponse.data;
    
    console.log(`📊 Total de configurações: ${allConfigs.length}`);
    
    // Filtrar configurações ativas
    const activeConfigs = allConfigs.filter(config => config.active);
    console.log(`✅ Configurações ativas: ${activeConfigs.length}`);
    
    // Mostrar configurações por seção
    const sectionsMap = new Map();
    activeConfigs.forEach(config => {
      if (!sectionsMap.has(config.section_id)) {
        sectionsMap.set(config.section_id, {
          title: config.section_title,
          items: []
        });
      }
      sectionsMap.get(config.section_id).items.push({
        id: config.item_id,
        title: config.item_title,
        description: config.item_description
      });
    });
    
    console.log('\n📋 Seções encontradas:');
    sectionsMap.forEach((section, sectionId) => {
      console.log(`\n  ${section.title} (${sectionId}):`);
      section.items.forEach(item => {
        console.log(`    - ${item.title} (${item.id})`);
      });
    });

    // 2. Verificar seções do menu
    console.log('\n2️⃣ Buscando seções do menu...');
    const sectionsResponse = await axios.get(`${BASE_URL}/whatsapp-menu/sections`);
    const sections = sectionsResponse.data;
    
    console.log(`📊 Total de seções: ${sections.length}`);
    sections.forEach(section => {
      console.log(`\n  ${section.title}:`);
      section.rows.forEach(row => {
        console.log(`    - ${row.title} (${row.id})`);
      });
    });

    // 3. Verificar se a seção de time favorito está presente
    const favoriteTeamSection = sections.find(section => 
      section.title.includes('Time Favorito') || section.title.includes('❤️')
    );
    
    if (favoriteTeamSection) {
      console.log('\n✅ Seção de Time Favorito encontrada!');
      console.log(`   Título: ${favoriteTeamSection.title}`);
      console.log(`   Itens: ${favoriteTeamSection.rows.length}`);
      favoriteTeamSection.rows.forEach(row => {
        console.log(`     - ${row.title} (${row.id})`);
      });
    } else {
      console.log('\n❌ Seção de Time Favorito NÃO encontrada!');
      console.log('🔧 Tentando resetar menu...');
      
      const resetResponse = await axios.post(`${BASE_URL}/whatsapp-menu/reset-default`);
      if (resetResponse.data.success) {
        console.log('✅ Menu resetado com sucesso!');
        console.log('🔄 Verifique novamente o menu no WhatsApp.');
      } else {
        console.log('❌ Erro ao resetar menu');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error.response?.data || error.message);
  }
}

// Executar verificação
checkMenuConfigs(); 