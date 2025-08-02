const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004/api/v1';

async function testAutoEnrollment() {
  console.log('🧪 Testando inscrição automática via API...\n');

  try {
    // 1. Criar um novo time
    console.log('1. Criando novo time...');
    const teamData = {
      name: "Time Teste API",
      short_name: "TTA",
      stadium_name: "Estádio Teste API",
      stadium_capacity: 15000,
      colors: {
        primary: "#FF0000",
        secondary: "#0000FF"
      },
      budget: 1000000,
      reputation: 50,
      fan_base: 1000,
      userId: "test-api-user"
    };

    const createResponse = await axios.post(`${API_BASE_URL}/game-teams`, teamData);
    console.log('✅ Time criado:', createResponse.data.data.name);
    const teamId = createResponse.data.data.id;

    // 2. Aguardar um pouco para o processamento
    console.log('\n2. Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Verificar se o time foi inscrito em uma competição
    console.log('\n3. Verificando inscrição em competição...');
    const competitionsResponse = await axios.get(`${API_BASE_URL}/competitions/for-new-users`);
    console.log('✅ Competições disponíveis:', competitionsResponse.data.data.length);

    if (competitionsResponse.data.data.length > 0) {
      const competitionId = competitionsResponse.data.data[0].id;
      console.log(`✅ Competição encontrada: ${competitionsResponse.data.data[0].name}`);

      // 4. Verificar partidas da competição
      console.log('\n4. Verificando partidas...');
      const matchesResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/matches`);
      console.log(`✅ Partidas encontradas: ${matchesResponse.data.data.length}`);

      if (matchesResponse.data.data.length === 0) {
        console.log('⚠️  Nenhuma partida foi criada automaticamente');
        
        // 5. Verificar times inscritos na competição
        console.log('\n5. Verificando times inscritos...');
        try {
          const teamsResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/teams`);
          console.log(`✅ Times inscritos: ${teamsResponse.data.data.length}`);
        } catch (error) {
          console.log('❌ Endpoint de times não encontrado');
        }
      } else {
        console.log('✅ Partidas criadas automaticamente!');
        matchesResponse.data.data.slice(0, 5).forEach(match => {
          console.log(`   - ${match.home_team_name} vs ${match.away_team_name} (Rodada ${match.round})`);
        });
      }
    }

    // 6. Verificar classificações
    console.log('\n6. Verificando classificações...');
    try {
      const standingsResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/standings`);
      console.log(`✅ Entradas de classificação: ${standingsResponse.data.data.length}`);
    } catch (error) {
      console.log('❌ Erro ao buscar classificações:', error.response?.data || error.message);
    }

    // 7. Limpar - deletar o time de teste
    console.log('\n7. Limpando dados de teste...');
    try {
      await axios.delete(`${API_BASE_URL}/game-teams/${teamId}`, {
        data: { userId: "test-api-user" }
      });
      console.log('✅ Time de teste deletado');
    } catch (error) {
      console.log('❌ Erro ao deletar time:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testAutoEnrollment(); 