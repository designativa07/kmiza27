const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testProfilePage() {
  console.log('🧪 Testando funcionalidade da Página de Perfil...\n');

  try {
    // 1. Testar busca de times
    console.log('1️⃣ Testando busca de times...');
    const teamsResponse = await axios.get(`${BASE_URL}/teams/all`);
    console.log(`✅ Times encontrados: ${teamsResponse.data.length}`);
    console.log('Primeiros 3 times:', teamsResponse.data.slice(0, 3).map(t => t.name));
    console.log('');

    // 2. Testar atualização de perfil
    console.log('2️⃣ Testando atualização de perfil...');
    const updateResponse = await axios.patch(`${BASE_URL}/users/1`, {
      name: 'Usuário Teste Atualizado',
      email: 'teste@exemplo.com'
    });
    console.log('✅ Perfil atualizado:', updateResponse.data.name);
    console.log('');

    // 3. Testar definição de time favorito
    console.log('3️⃣ Testando definição de time favorito...');
    const setTeamResponse = await axios.post(`${BASE_URL}/users/phone/5511999999999/favorite-team`, {
      teamSlug: 'flamengo'
    });
    console.log('✅ Time favorito definido:', setTeamResponse.data.favorite_team?.name);
    console.log('');

    // 4. Testar remoção de time favorito
    console.log('4️⃣ Testando remoção de time favorito...');
    const removeTeamResponse = await axios.delete(`${BASE_URL}/users/phone/5511999999999/favorite-team`);
    console.log('✅ Time favorito removido:', removeTeamResponse.data.favorite_team === null);
    console.log('');

    console.log('✅ Todos os testes da página de perfil concluídos!');
    console.log('\n📱 Funcionalidades testadas:');
    console.log('   • Busca de times');
    console.log('   • Atualização de dados do perfil');
    console.log('   • Definição de time favorito');
    console.log('   • Remoção de time favorito');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

// Executar testes
testProfilePage(); 