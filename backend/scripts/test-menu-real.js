const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '5511999999999'; // Substitua pelo seu número real

async function testMenuReal() {
  console.log('🧪 Testando menu real no WhatsApp...\n');

  try {
    // 1. Enviar menu para WhatsApp real
    console.log('1️⃣ Enviando menu para WhatsApp...');
    const menuResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'menu',
      phoneNumber: TEST_PHONE
    });
    
    console.log('✅ Menu enviado!');
    console.log('📱 Verifique seu WhatsApp para ver o menu');
    
    // 2. Verificar se há erros nos logs
    console.log('\n2️⃣ Verificando seções do menu...');
    const sectionsResponse = await axios.get(`${BASE_URL}/whatsapp-menu/sections`);
    const sections = sectionsResponse.data;
    
    console.log(`📊 Total de seções: ${sections.length}`);
    let totalItems = 0;
    
    sections.forEach((section, index) => {
      console.log(`\n  Seção ${index + 1}: ${section.title}`);
      console.log(`    Itens: ${section.rows.length}`);
      totalItems += section.rows.length;
      
      section.rows.forEach((row, rowIndex) => {
        console.log(`      ${rowIndex + 1}. ${row.title} (${row.id})`);
      });
    });
    
    console.log(`\n📊 Total de itens: ${totalItems}`);
    
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
    }
    
    // 4. Verificar limitações do WhatsApp
    console.log('\n3️⃣ Verificando limitações...');
    console.log(`   - Máximo de seções: 10 (WhatsApp)`);
    console.log(`   - Máximo de itens por seção: 10 (WhatsApp)`);
    console.log(`   - Total de itens: ${totalItems}`);
    
    if (sections.length > 10) {
      console.log('⚠️  AVISO: Muitas seções! WhatsApp pode não exibir todas.');
    }
    
    if (totalItems > 100) {
      console.log('⚠️  AVISO: Muitos itens! WhatsApp pode não exibir todos.');
    }
    
    console.log('\n📱 Instruções:');
    console.log('   1. Verifique seu WhatsApp');
    console.log('   2. Procure pela mensagem do bot');
    console.log('   3. Clique em "VER OPÇÕES"');
    console.log('   4. Procure pela seção "❤️ Meu Time Favorito"');
    console.log('   5. Se não aparecer, pode ser limitação do WhatsApp');

  } catch (error) {
    console.error('❌ Erro ao testar menu:', error.response?.data || error.message);
  }
}

// Executar teste
testMenuReal(); 