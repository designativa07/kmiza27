const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function checkMatchRound() {
  try {
    console.log('🔍 Verificando rodada do jogo...');
    
    const matchId = 1505; // ID do jogo existente
    
    // 1. Buscar detalhes do jogo
    console.log('\n1. Buscando detalhes do jogo...');
    try {
      const matchResponse = await axios.get(`${API_URL}/amateur/matches/${matchId}`);
      console.log('✅ Jogo encontrado:', matchResponse.data.home_team.name + ' vs ' + matchResponse.data.away_team.name);
      console.log('📅 Data do jogo:', matchResponse.data.match_date);
      console.log('🏟️ Estádio:', matchResponse.data.stadium?.name || 'Não definido');
      console.log('📊 Placar:', matchResponse.data.home_score + ' x ' + matchResponse.data.away_score);
      console.log('🔄 Round ID:', matchResponse.data.round?.id || 'Não associado');
      console.log('📋 Round Name:', matchResponse.data.round?.name || 'Não associado');
    } catch (error) {
      console.log('❌ Erro ao buscar jogo:', error.response?.data || error.message);
    }
    
    // 2. Verificar todas as rodadas da competição
    console.log('\n2. Verificando todas as rodadas...');
    try {
      const roundsResponse = await axios.get(`${API_URL}/rounds`);
      console.log('📊 Total de rodadas no sistema:', roundsResponse.data.length);
      
      const competitionRounds = roundsResponse.data.filter(r => r.competition?.id === 23);
      console.log('🏆 Rodadas da competição:', competitionRounds.length);
      
      if (competitionRounds.length > 0) {
        console.log('📋 Rodadas da competição:');
        competitionRounds.forEach((round, index) => {
          console.log(`${index + 1}. ${round.name} (ID: ${round.id})`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao buscar rodadas:', error.response?.data || error.message);
    }
    
    // 3. Associar jogo à primeira rodada
    console.log('\n3. Associando jogo à primeira rodada...');
    try {
      const updateMatchData = {
        round_id: 115 // ID da rodada criada
      };
      
      const updateResponse = await axios.patch(`${API_URL}/amateur/matches/${matchId}`, updateMatchData);
      console.log('✅ Jogo atualizado:', updateResponse.data);
    } catch (error) {
      console.log('❌ Erro ao atualizar jogo:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

checkMatchRound(); 