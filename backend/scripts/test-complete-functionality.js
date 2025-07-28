const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testCompleteFunctionality() {
  console.log('=== TESTE COMPLETO DO SISTEMA AMADOR ===\n');

  try {
    // 1. Testar GET /amateur/teams
    console.log('1. Testando GET /amateur/teams...');
    try {
      const teamsResponse = await axios.get(`${API_URL}/amateur/teams`);
      console.log('✅ Times encontrados:', teamsResponse.data.length);
      teamsResponse.data.forEach(team => {
        console.log(`   - ${team.name} (ID: ${team.id})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar times:', error.response?.status);
    }

    // 2. Testar GET /amateur/players
    console.log('\n2. Testando GET /amateur/players...');
    try {
      const playersResponse = await axios.get(`${API_URL}/amateur/players`);
      console.log('✅ Jogadores encontrados:', playersResponse.data.length);
      playersResponse.data.forEach(player => {
        console.log(`   - ${player.name} (ID: ${player.id}, ${player.position})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar jogadores:', error.response?.status);
    }

    // 3. Testar GET /amateur/teams/237/players
    console.log('\n3. Testando GET /amateur/teams/237/players...');
    try {
      const team237Response = await axios.get(`${API_URL}/amateur/teams/237/players`);
      console.log('✅ Jogadores do time 237:', team237Response.data.length);
      team237Response.data.forEach(player => {
        console.log(`   - ${player.player?.name} (${player.jersey_number || 'sem número'})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar jogadores do time 237:', error.response?.status);
    }

    // 4. Testar GET /amateur/teams/238/players
    console.log('\n4. Testando GET /amateur/teams/238/players...');
    try {
      const team238Response = await axios.get(`${API_URL}/amateur/teams/238/players`);
      console.log('✅ Jogadores do time 238:', team238Response.data.length);
      team238Response.data.forEach(player => {
        console.log(`   - ${player.player?.name} (${player.jersey_number || 'sem número'})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar jogadores do time 238:', error.response?.status);
    }

    // 5. Testar GET /amateur/teams/237 (dados do time)
    console.log('\n5. Testando GET /amateur/teams/237...');
    try {
      const team237DataResponse = await axios.get(`${API_URL}/amateur/teams/237`);
      console.log('✅ Dados do time 237:', team237DataResponse.data.name);
    } catch (error) {
      console.log('❌ Erro ao buscar dados do time 237:', error.response?.status);
    }

    // 6. Testar GET /amateur/teams/238 (dados do time)
    console.log('\n6. Testando GET /amateur/teams/238...');
    try {
      const team238DataResponse = await axios.get(`${API_URL}/amateur/teams/238`);
      console.log('✅ Dados do time 238:', team238DataResponse.data.name);
    } catch (error) {
      console.log('❌ Erro ao buscar dados do time 238:', error.response?.status);
    }

  } catch (error) {
    console.error('Erro geral:', error.message);
  }

  console.log('\n=== TESTE FINALIZADO ===');
  console.log('\nPara testar a interface:');
  console.log('- Página de times: http://localhost:3001/admin-amadores/times');
  console.log('- Elenco time 237: http://localhost:3001/admin-amadores/times/237/jogadores');
  console.log('- Elenco time 238: http://localhost:3001/admin-amadores/times/238/jogadores');
}

testCompleteFunctionality(); 