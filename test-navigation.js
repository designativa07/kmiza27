// Script para testar a navegação do painel amador
const API_URL = 'http://localhost:3001';

async function testNavigation() {
  try {
    console.log('🧪 Testando navegação do painel amador...');
    
    // 1. Testar se o painel principal está acessível
    console.log('\n1. Testando acesso ao painel principal...');
    const mainResponse = await fetch(`${API_URL}/admin-amadores`);
    console.log(`Status /admin-amadores: ${mainResponse.status}`);
    
    // 2. Testar se as páginas de navegação estão funcionando
    console.log('\n2. Testando páginas de navegação...');
    
    const navigationPages = [
      '/admin-amadores/competicoes',
      '/admin-amadores/times',
      '/admin-amadores/jogadores',
      '/admin-amadores/jogos',
      '/admin-amadores/estadios',
      '/admin-amadores/estatisticas'
    ];
    
    for (const page of navigationPages) {
      try {
        const response = await fetch(`${API_URL}${page}`);
        console.log(`Status ${page}: ${response.status}`);
      } catch (error) {
        console.log(`❌ Erro ao acessar ${page}: ${error.message}`);
      }
    }
    
    // 3. Testar endpoints da API (backend na porta 3000)
    console.log('\n3. Testando endpoints da API...');
    
    const apiEndpoints = [
      'http://localhost:3000/api/amateur/competitions',
      'http://localhost:3000/api/amateur/teams',
      'http://localhost:3000/api/amateur/players',
      'http://localhost:3000/api/amateur/matches',
      'http://localhost:3000/api/amateur/stadiums'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint);
        console.log(`Status ${endpoint}: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ ${data.length} itens encontrados`);
        }
      } catch (error) {
        console.log(`❌ Erro ao acessar ${endpoint}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Teste de navegação concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testNavigation(); 