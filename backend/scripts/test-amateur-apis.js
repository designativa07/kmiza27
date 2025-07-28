const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testAmateurAPIs() {
  console.log('=== TESTANDO APIS AMADORAS ===\n');

  try {
    // 1. Testar GET /amateur/players
    console.log('1. Testando GET /amateur/players...');
    try {
      const playersResponse = await axios.get(`${API_URL}/amateur/players`);
      console.log('✅ Jogadores encontrados:', playersResponse.data.length);
    } catch (error) {
      console.log('❌ Erro ao buscar jogadores:', error.response?.status, error.response?.data?.message);
    }

    // 2. Testar GET /amateur/teams/238
    console.log('\n2. Testando GET /amateur/teams/238...');
    try {
      const teamResponse = await axios.get(`${API_URL}/amateur/teams/238`);
      console.log('✅ Time encontrado:', teamResponse.data.name);
    } catch (error) {
      console.log('❌ Erro ao buscar time:', error.response?.status, error.response?.data?.message);
    }

    // 3. Testar GET /amateur/teams/238/players
    console.log('\n3. Testando GET /amateur/teams/238/players...');
    try {
      const teamPlayersResponse = await axios.get(`${API_URL}/amateur/teams/238/players`);
      console.log('✅ Jogadores do time encontrados:', teamPlayersResponse.data.length);
    } catch (error) {
      console.log('❌ Erro ao buscar jogadores do time:', error.response?.status, error.response?.data?.message);
    }

    // 4. Testar GET /amateur/competitions/23/teams
    console.log('\n4. Testando GET /amateur/competitions/23/teams...');
    try {
      const competitionTeamsResponse = await axios.get(`${API_URL}/amateur/competitions/23/teams`);
      console.log('✅ Times da competição encontrados:', competitionTeamsResponse.data.length);
    } catch (error) {
      console.log('❌ Erro ao buscar times da competição:', error.response?.status, error.response?.data?.message);
    }

    // 5. Testar POST /amateur/teams/238/players
    console.log('\n5. Testando POST /amateur/teams/238/players...');
    try {
      const testTeamPlayers = [
        {
          player_id: 1,
          team_id: 238,
          jersey_number: '10',
          role: 'Capitão',
          start_date: '2024-01-01'
        }
      ];
      
      const postTeamPlayersResponse = await axios.post(`${API_URL}/amateur/teams/238/players`, {
        team_players: testTeamPlayers
      });
      console.log('✅ Jogadores do time salvos:', postTeamPlayersResponse.data);
    } catch (error) {
      console.log('❌ Erro ao salvar jogadores do time:', error.response?.status, error.response?.data?.message);
    }

    // 6. Testar POST /amateur/competitions/23/teams
    console.log('\n6. Testando POST /amateur/competitions/23/teams...');
    try {
      const testCompetitionTeams = [
        {
          competition_id: 23,
          team_id: 238,
          group_name: 'Grupo A',
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0
        }
      ];
      
      const postCompetitionTeamsResponse = await axios.post(`${API_URL}/amateur/competitions/23/teams`, {
        competition_teams: testCompetitionTeams
      });
      console.log('✅ Times da competição salvos:', postCompetitionTeamsResponse.data);
    } catch (error) {
      console.log('❌ Erro ao salvar times da competição:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('Erro geral:', error.message);
  }

  console.log('\n=== TESTE FINALIZADO ===');
}

testAmateurAPIs(); 