const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function createRoundsForCompetition() {
  try {
    console.log('🔍 Criando rodadas para a competição amadora...');
    
    const competitionId = 23;
    
    // 1. Verificar se já existem rodadas
    console.log('\n1. Verificando rodadas existentes...');
    try {
      const roundsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/rounds`);
      console.log('📊 Rodadas existentes:', roundsResponse.data.length);
      
      if (roundsResponse.data.length > 0) {
        console.log('✅ Já existem rodadas criadas!');
        return;
      }
    } catch (error) {
      console.log('❌ Erro ao verificar rodadas:', error.response?.data || error.message);
    }
    
    // 2. Criar rodadas manualmente no banco
    console.log('\n2. Criando rodadas...');
    
    // Dados das rodadas para criar
    const roundsData = [
      {
        name: 'Rodada 1',
        round_number: 1,
        phase: 'group',
        competition_id: competitionId
      },
      {
        name: 'Rodada 2', 
        round_number: 2,
        phase: 'group',
        competition_id: competitionId
      },
      {
        name: 'Rodada 3',
        round_number: 3,
        phase: 'group', 
        competition_id: competitionId
      }
    ];
    
    console.log('📝 Rodadas a serem criadas:', roundsData.length);
    
    // 3. Verificar se existe endpoint para criar rodadas
    console.log('\n3. Verificando endpoint para criar rodadas...');
    try {
      const createRoundResponse = await axios.post(`${API_URL}/rounds`, roundsData[0]);
      console.log('✅ Primeira rodada criada:', createRoundResponse.data);
    } catch (error) {
      console.log('❌ Erro ao criar rodada:', error.response?.status, error.response?.data || error.message);
      console.log('💡 Pode ser necessário criar as rodadas diretamente no banco de dados');
    }
    
    // 4. Verificar rodadas novamente
    console.log('\n4. Verificando rodadas após criação...');
    try {
      const roundsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/rounds`);
      console.log('✅ Rodadas encontradas:', roundsResponse.data.length);
      if (roundsResponse.data.length > 0) {
        console.log('📋 Rodadas:', roundsResponse.data.map(r => r.name));
      }
    } catch (error) {
      console.log('❌ Erro ao verificar rodadas:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

createRoundsForCompetition(); 