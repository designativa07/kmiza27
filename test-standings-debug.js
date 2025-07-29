const API_URL = 'http://localhost:3000';

async function testStandings() {
  try {
    console.log('=== TESTE DE CLASSIFICAÇÃO AMADOR ===');
    
    // 1. Buscar competições amadoras
    console.log('\n1. Buscando competições amadoras...');
    const competitionsResponse = await fetch(`${API_URL}/amateur/competitions`);
    const competitions = await competitionsResponse.json();
    console.log('Competições encontradas:', competitions.length);
    
    if (competitions.length === 0) {
      console.log('❌ Nenhuma competição amadora encontrada');
      return;
    }
    
    const competition = competitions[0];
    console.log('Competição selecionada:', competition.name, '(ID:', competition.id, ')');
    
    // 2. Buscar times da competição
    console.log('\n2. Buscando times da competição...');
    const teamsResponse = await fetch(`${API_URL}/amateur/competitions/${competition.id}/teams`);
    const competitionTeams = await teamsResponse.json();
    console.log('Times na competição:', competitionTeams.length);
    
    if (competitionTeams.length === 0) {
      console.log('❌ Nenhum time associado à competição');
      
      // 2.1. Buscar todos os times amadores disponíveis
      console.log('\n2.1. Buscando times amadores disponíveis...');
      const allTeamsResponse = await fetch(`${API_URL}/amateur/teams`);
      const allTeams = await allTeamsResponse.json();
      console.log('Times amadores disponíveis:', allTeams.length);
      
      allTeams.forEach(team => {
        console.log(`- ${team.name} (ID: ${team.id})`);
      });
      
      if (allTeams.length > 0) {
        console.log('\n💡 SOLUÇÃO: Você precisa adicionar times à competição.');
        console.log('1. Acesse: http://localhost:3001/admin-amadores/competicoes');
        console.log('2. Clique no botão "Times" da competição');
        console.log('3. Adicione os times desejados');
        console.log('4. Salve as alterações');
      } else {
        console.log('\n❌ Não há times amadores criados.');
        console.log('💡 SOLUÇÃO: Crie times primeiro em: http://localhost:3001/admin-amadores/times');
      }
      
      return;
    }
    
    competitionTeams.forEach(ct => {
      console.log(`- ${ct.team.name} (ID: ${ct.team.id})`);
    });
    
    // 3. Buscar jogos da competição
    console.log('\n3. Buscando jogos da competição...');
    const matchesResponse = await fetch(`${API_URL}/amateur/matches?competitionId=${competition.id}`);
    const matches = await matchesResponse.json();
    console.log('Jogos encontrados:', matches.length);
    
    matches.forEach(match => {
      console.log(`- ${match.home_team.name} ${match.home_score} x ${match.away_score} ${match.away_team.name} (Status: ${match.status})`);
      console.log(`  ID: ${match.id}, Competition ID: ${match.competition_id}, Category: ${match.category}`);
    });
    
    // 4. Buscar jogos finalizados
    const finishedMatches = matches.filter(match => match.status === 'finished');
    console.log('\nJogos finalizados:', finishedMatches.length);
    
    finishedMatches.forEach(match => {
      console.log(`✅ FINALIZADO: ${match.home_team.name} ${match.home_score} x ${match.away_score} ${match.away_team.name}`);
    });
    
    // 5. Buscar TODOS os jogos amadores para verificar se há algum perdido
    console.log('\n4. Buscando TODOS os jogos amadores...');
    const allMatchesResponse = await fetch(`${API_URL}/amateur/matches`);
    const allMatches = await allMatchesResponse.json();
    console.log('Total de jogos amadores:', allMatches.length);
    
    allMatches.forEach(match => {
      if (match.competition_id === competition.id) {
        console.log(`🎯 MATCH DA COMPETIÇÃO: ${match.home_team.name} ${match.home_score} x ${match.away_score} ${match.away_team.name} (Status: ${match.status})`);
      }
    });
    
    // 6. Verificar match específico que tem competition_id undefined
    console.log('\n5. Verificando match específico...');
    const problemMatch = matches.find(match => match.competition_id === undefined);
    if (problemMatch) {
      console.log('🔍 MATCH COM PROBLEMA:');
      console.log(JSON.stringify(problemMatch, null, 2));
      
      // Tentar corrigir o match
      console.log('\n6. Tentando corrigir o match...');
      const updateMatchResponse = await fetch(`${API_URL}/amateur/matches/${problemMatch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competition_id: competition.id
        })
      });
      
      if (updateMatchResponse.ok) {
        console.log('✅ Match corrigido com sucesso!');
      } else {
        const error = await updateMatchResponse.text();
        console.log('❌ Erro ao corrigir match:', updateMatchResponse.status, error);
      }
    }
    
    // 7. Testar endpoint de classificação
    console.log('\n7. Testando endpoint de classificação...');
    const standingsResponse = await fetch(`${API_URL}/amateur/standings/${competition.id}`);
    
    if (standingsResponse.ok) {
      const standings = await standingsResponse.json();
      console.log('Classificação encontrada:', standings.length, 'times');
      
      standings.forEach((standing, index) => {
        console.log(`${index + 1}. ${standing.team.name} - ${standing.points}pts (${standing.played}J ${standing.won}V ${standing.drawn}E ${standing.lost}D)`);
      });
    } else {
      const error = await standingsResponse.text();
      console.log('❌ Erro ao buscar classificação:', standingsResponse.status, error);
    }
    
    // 8. Forçar atualização da classificação (testar endpoint correto)
    console.log('\n8. Forçando atualização da classificação...');
    const updateResponse = await fetch(`${API_URL}/amateur/competitions/${competition.id}/update-standings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (updateResponse.ok) {
      console.log('✅ Classificação atualizada com sucesso');
    } else {
      const error = await updateResponse.text();
      console.log('❌ Erro ao atualizar classificação:', updateResponse.status, error);
    }
    
    // 9. Testar novamente após atualização
    console.log('\n9. Testando classificação após atualização...');
    const standingsResponse2 = await fetch(`${API_URL}/amateur/standings/${competition.id}`);
    
    if (standingsResponse2.ok) {
      const standings2 = await standingsResponse2.json();
      console.log('Classificação após atualização:', standings2.length, 'times');
      
      standings2.forEach((standing, index) => {
        console.log(`${index + 1}. ${standing.team.name} - ${standing.points}pts (${standing.played}J ${standing.won}V ${standing.drawn}E ${standing.lost}D)`);
      });
    } else {
      const error = await standingsResponse2.text();
      console.log('❌ Erro ao buscar classificação após atualização:', standingsResponse2.status, error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testStandings(); 