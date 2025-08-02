const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '5511999999999';

async function testMenuWhatsApp() {
  console.log('🧪 Testando menu do WhatsApp...\n');

  try {
    // 1. Testar envio de menu
    console.log('1️⃣ Testando envio de menu...');
    const menuResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'menu',
      phoneNumber: TEST_PHONE
    });
    
    console.log('✅ Resposta do menu:');
    console.log(menuResponse.data.response || menuResponse.data);
    
    // 2. Verificar se o menu contém a seção de time favorito
    const menuText = menuResponse.data.response || menuResponse.data;
    if (menuText.includes('❤️ Meu Time Favorito') || menuText.includes('Time Favorito')) {
      console.log('\n✅ Menu contém seção de Time Favorito!');
    } else {
      console.log('\n❌ Menu NÃO contém seção de Time Favorito');
      console.log('🔍 Verificando seções disponíveis...');
      
      // 3. Verificar seções do menu via API
      const sectionsResponse = await axios.get(`${BASE_URL}/whatsapp-menu/sections`);
      const sections = sectionsResponse.data;
      
      console.log(`📊 Total de seções: ${sections.length}`);
      sections.forEach(section => {
        console.log(`  - ${section.title}: ${section.rows.length} itens`);
        if (section.title.includes('Time Favorito') || section.title.includes('❤️')) {
          console.log(`    ✅ Seção de Time Favorito encontrada!`);
          section.rows.forEach(row => {
            console.log(`      - ${row.title} (${row.id})`);
          });
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro ao testar menu:', error.response?.data || error.message);
  }
}

// Executar teste
testMenuWhatsApp(); 