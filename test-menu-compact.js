// Script para testar se o menu compacto está funcionando
const API_URL = 'http://localhost:3001';

async function testCompactMenu() {
  try {
    console.log('🧪 Testando menu compacto...');

    // 1. Testar se o painel principal está acessível
    console.log('\n1. Testando acesso ao painel principal...');
    const mainResponse = await fetch(`${API_URL}/admin-amadores`);
    console.log(`Status /admin-amadores: ${mainResponse.status}`);

    if (mainResponse.ok) {
      const html = await mainResponse.text();
      
      // Verificar se todos os itens do menu estão presentes
      const menuItems = [
        'Dashboard',
        'Competições',
        'Times',
        'Jogadores',
        'Jogos',
        'Estádios',
        'Estatísticas',
        'Minha Conta'
      ];

      console.log('\n2. Verificando itens do menu...');
      menuItems.forEach(item => {
        if (html.includes(item)) {
          console.log(`✅ "${item}" encontrado no menu`);
        } else {
          console.log(`❌ "${item}" não encontrado no menu`);
        }
      });

      // Verificar se há classes CSS relacionadas ao menu compacto
      if (html.includes('text-xs') && html.includes('space-x-2')) {
        console.log('\n✅ Classes CSS do menu compacto encontradas');
      } else {
        console.log('\n⚠️ Classes CSS do menu compacto não encontradas');
      }

      // Verificar se há overflow-x-auto (para scroll horizontal se necessário)
      if (html.includes('overflow-x-auto')) {
        console.log('✅ Scroll horizontal configurado para o menu');
      }
    }

    // 3. Testar navegação entre páginas
    console.log('\n3. Testando navegação entre páginas...');
    const testPages = [
      '/admin-amadores/competicoes',
      '/admin-amadores/times',
      '/admin-amadores/jogadores',
      '/admin-amadores/jogos',
      '/admin-amadores/estadios',
      '/admin-amadores/estatisticas',
      '/admin-amadores/conta'
    ];

    for (const page of testPages) {
      try {
        const response = await fetch(`${API_URL}${page}`);
        console.log(`Status ${page}: ${response.status}`);
      } catch (error) {
        console.log(`❌ Erro ao acessar ${page}: ${error.message}`);
      }
    }

    console.log('\n🎉 Teste do menu compacto concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCompactMenu(); 