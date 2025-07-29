// Usar fetch global do Node.js

async function testStandingsUpdate() {
  console.log('🧪 Testando atualização de estatísticas da classificação...\n');

  try {
    // 1. Buscar a competição amadora
    console.log('1. Buscando competições amadoras...');
    const competitionsResponse = await fetch('http://localhost:3001/api/amateur/competitions');
    const competitions = await competitionsResponse.json();
    
    if (!competitions || competitions.length === 0) {
      console.log('❌ Nenhuma competição amadora encontrada');
      return;
    }

    const competition = competitions[0];
    console.log(`✅ Competição encontrada: ${competition.name} (ID: ${competition.id})`);

    // 2. Buscar times da competição
    console.log('\n2. Buscando times da competição...');
    const teamsResponse = await fetch(`http://localhost:3001/api/amateur/competitions/${competition.id}/teams`);
    const teams = await teamsResponse.json();
    console.log(`✅ ${teams.length} times encontrados na competição`);

    // 3. Buscar jogos da competição
    console.log('\n3. Buscando jogos da competição...');
    const matchesResponse = await fetch(`http://localhost:3001/api/amateur/matches?competitionId=${competition.id}`);
    const matches = await matchesResponse.json();
    console.log(`✅ ${matches.length} jogos encontrados na competição`);

    // Filtrar jogos finalizados
    const finishedMatches = matches.filter(match => match.status === 'finished' && match.home_score !== null && match.away_score !== null);
    console.log(`📊 ${finishedMatches.length} jogos finalizados com placar`);

    // 4. Buscar classificação atual
    console.log('\n4. Buscando classificação atual...');
    const standingsResponse = await fetch(`http://localhost:3001/api/amateur/standings/${competition.id}`);
    const standings = await standingsResponse.json();
    console.log(`✅ Classificação carregada com ${standings.length} times`);

    // Mostrar estatísticas atuais
    console.log('\n📊 Estatísticas atuais:');
    standings.forEach((team, index) => {
      console.log(`${index + 1}. ${team.team.name}: ${team.points}pts, ${team.played}J, ${team.won}V, ${team.drawn}E, ${team.lost}D, ${team.goals_for}GP, ${team.goals_against}GC`);
    });

    // 5. Forçar atualização das estatísticas
    console.log('\n5. Forçando atualização das estatísticas...');
    const updateResponse = await fetch(`http://localhost:3001/api/amateur/competitions/${competition.id}/update-standings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Token de teste
      }
    });

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log(`✅ ${updateResult.message}`);
    } else {
      console.log(`❌ Erro ao atualizar estatísticas: ${updateResponse.status}`);
    }

    // 6. Buscar classificação atualizada
    console.log('\n6. Buscando classificação atualizada...');
    const updatedStandingsResponse = await fetch(`http://localhost:3001/api/amateur/standings/${competition.id}`);
    const updatedStandings = await updatedStandingsResponse.json();

    console.log('\n📊 Estatísticas atualizadas:');
    updatedStandings.forEach((team, index) => {
      console.log(`${index + 1}. ${team.team.name}: ${team.points}pts, ${team.played}J, ${team.won}V, ${team.drawn}E, ${team.lost}D, ${team.goals_for}GP, ${team.goals_against}GC`);
    });

    // 7. Verificar se houve mudanças
    const hasChanges = JSON.stringify(standings) !== JSON.stringify(updatedStandings);
    if (hasChanges) {
      console.log('\n✅ As estatísticas foram atualizadas com sucesso!');
    } else {
      console.log('\n⚠️ Nenhuma mudança detectada nas estatísticas');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testStandingsUpdate(); 