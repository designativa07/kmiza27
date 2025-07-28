const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEAM_ID = 237; // ou 238, dependendo de qual você quer testar

// Token válido (substitua por um token real)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlzQWRtaW4iOnRydWUsImlhdCI6MTczNTM2NTYzMCwiZXhwIjoxNzM1NDUyMDMwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testMultiplePlayers() {
  console.log('=== TESTE DE MÚLTIPLOS JOGADORES ===\n');

  try {
    // 1. Primeiro, vamos ver quantos jogadores existem
    console.log('1. Verificando jogadores disponíveis...');
    const playersResponse = await axios.get(`${API_URL}/amateur/players`);
    console.log('Jogadores disponíveis:', playersResponse.data.length);
    playersResponse.data.slice(0, 5).forEach(player => {
      console.log(`   - ${player.name} (ID: ${player.id})`);
    });

    // 2. Verificar jogadores atuais do time
    console.log('\n2. Verificando jogadores atuais do time...');
    const currentPlayersResponse = await axios.get(`${API_URL}/amateur/teams/${TEAM_ID}/players`);
    console.log('Jogadores atuais do time:', currentPlayersResponse.data.length);
    currentPlayersResponse.data.forEach(player => {
      console.log(`   - ${player.player?.name} (ID: ${player.player?.id})`);
    });

    // 3. Preparar dados para salvar múltiplos jogadores
    console.log('\n3. Preparando dados para salvar múltiplos jogadores...');
    const teamPlayersData = {
      team_players: [
        {
          player_id: playersResponse.data[0]?.id || 46,
          jersey_number: '10',
          role: 'Titular',
          start_date: '2025-01-01'
        },
        {
          player_id: playersResponse.data[1]?.id || 47,
          jersey_number: '7',
          role: 'Reserva',
          start_date: '2025-01-01'
        },
        {
          player_id: playersResponse.data[2]?.id || 48,
          jersey_number: '9',
          role: 'Titular',
          start_date: '2025-01-01'
        }
      ].filter(player => player.player_id > 0) // Filtrar apenas jogadores válidos
    };

    console.log('Dados a serem enviados:', JSON.stringify(teamPlayersData, null, 2));

    // 4. Salvar múltiplos jogadores
    console.log('\n4. Salvando múltiplos jogadores...');
    try {
      const saveResponse = await axios.post(
        `${API_URL}/amateur/teams/${TEAM_ID}/players`,
        teamPlayersData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_TOKEN}`
          }
        }
      );
      console.log('✅ Resposta do salvamento:', saveResponse.data);
    } catch (error) {
      console.log('❌ Erro ao salvar:', error.response?.status, error.response?.data);
      return;
    }

    // 5. Verificar jogadores após salvar
    console.log('\n5. Verificando jogadores após salvar...');
    const updatedPlayersResponse = await axios.get(`${API_URL}/amateur/teams/${TEAM_ID}/players`);
    console.log('Jogadores após salvar:', updatedPlayersResponse.data.length);
    updatedPlayersResponse.data.forEach(player => {
      console.log(`   - ${player.player?.name} (ID: ${player.player?.id}, Número: ${player.jersey_number}, Função: ${player.role})`);
    });

  } catch (error) {
    console.error('Erro geral:', error.message);
  }

  console.log('\n=== TESTE FINALIZADO ===');
}

testMultiplePlayers(); 