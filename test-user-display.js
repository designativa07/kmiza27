// Script para testar se o nome do usuário está sendo exibido corretamente
const API_URL = 'http://localhost:3001';

async function testUserDisplay() {
  try {
    console.log('🧪 Testando exibição do nome do usuário...');
    
    // 1. Testar se o painel principal está acessível
    console.log('\n1. Testando acesso ao painel principal...');
    const mainResponse = await fetch(`${API_URL}/admin-amadores`);
    console.log(`Status /admin-amadores: ${mainResponse.status}`);
    
    if (mainResponse.ok) {
      const html = await mainResponse.text();
      
      // Verificar se o nome do usuário está presente no HTML
      const userPattern = /Logado como.*?<span[^>]*>([^<]+)<\/span>/g;
      const matches = [...html.matchAll(userPattern)];
      
      if (matches.length > 0) {
        console.log('✅ Nome do usuário encontrado no HTML');
        matches.forEach((match, index) => {
          console.log(`  ${index + 1}. "${match[1]}"`);
        });
      } else {
        console.log('❌ Nome do usuário não encontrado no HTML');
        
        // Verificar se há algum texto relacionado ao usuário
        if (html.includes('Logado como')) {
          console.log('  ℹ️  Texto "Logado como" encontrado, mas nome não está sendo exibido');
        }
        
        if (html.includes('Usuário')) {
          console.log('  ℹ️  Texto "Usuário" encontrado (fallback)');
        }
      }
    }
    
    // 2. Testar página de conta
    console.log('\n2. Testando página de conta...');
    const contaResponse = await fetch(`${API_URL}/admin-amadores/conta`);
    console.log(`Status /admin-amadores/conta: ${contaResponse.status}`);
    
    if (contaResponse.ok) {
      const html = await contaResponse.text();
      
      // Verificar se há informações do perfil
      if (html.includes('Informações do Perfil')) {
        console.log('✅ Página de conta carregada corretamente');
      } else {
        console.log('❌ Página de conta não carregou corretamente');
      }
    }
    
    console.log('\n🎉 Teste de exibição do usuário concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testUserDisplay(); 