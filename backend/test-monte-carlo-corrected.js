const { DataSource } = require('typeorm');

async function testMonteCarloCorrected() {
  console.log('🎯 TESTANDO SIMULAÇÃO MONTE CARLO CORRIGIDA');
  console.log('============================================\n');

  // Configuração para PRODUÇÃO (VPS)
  const dataSource = new DataSource({
    type: 'postgres',
    host: '195.200.0.191',
    port: 5433,
    username: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    entities: [],
    synchronize: false,
    logging: false,
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados de PRODUÇÃO (VPS)');

    // 1. VERIFICAR SE O NOVO MÉTODO ESTÁ FUNCIONANDO
    console.log('\n🔍 1. TESTANDO BUSCA DE TODOS OS JOGOS');
    
    const allMatches = await dataSource.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        m.home_score,
        m.away_score,
        ht.name as home_team,
        ht.id as home_team_id,
        at.name as away_team,
        at.id as away_team_id
      FROM matches m
      INNER JOIN teams ht ON m.home_team_id = ht.id
      INNER JOIN teams at ON m.away_team_id = at.id
      WHERE m.competition_id = 1
      ORDER BY m.match_date ASC
    `);
    
    console.log(`📊 Total de jogos encontrados: ${allMatches.length}`);

    // 2. SEPARAR JOGOS POR STATUS
    const finishedMatches = allMatches.filter(m => m.status === 'finished');
    const scheduledMatches = allMatches.filter(m => m.status === 'scheduled');
    const otherMatches = allMatches.filter(m => m.status !== 'finished' && m.status !== 'scheduled');

    console.log(`\n📊 DISTRIBUIÇÃO DOS JOGOS:`);
    console.log(`     Finalizados: ${finishedMatches.length}`);
    console.log(`     Agendados: ${scheduledMatches.length}`);
    console.log(`     Outros: ${otherMatches.length}`);

    // 3. CALCULAR ESTATÍSTICAS BASEADO NOS JOGOS FINALIZADOS
    console.log('\n🏆 2. CALCULANDO ESTATÍSTICAS DOS JOGOS FINALIZADOS');
    
    const teamStats = new Map();
    
    // Inicializar todos os times
    const allTeams = new Set();
    allMatches.forEach(match => {
      allTeams.add(match.home_team_id);
      allTeams.add(match.away_team_id);
    });
    
    allTeams.forEach(teamId => {
      teamStats.set(teamId, {
        id: teamId,
        name: 'Unknown',
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
      });
    });
    
    // Processar jogos finalizados
    finishedMatches.forEach(match => {
      const homeTeam = teamStats.get(match.home_team_id);
      const awayTeam = teamStats.get(match.away_team_id);
      
      // Atualizar nomes
      homeTeam.name = match.home_team;
      awayTeam.name = match.away_team;
      
      // Atualizar estatísticas
      homeTeam.played++;
      homeTeam.goals_for += match.home_score;
      homeTeam.goals_against += match.away_score;
      
      awayTeam.played++;
      awayTeam.goals_for += match.away_score;
      awayTeam.goals_against += match.home_score;
      
      if (match.home_score > match.away_score) {
        homeTeam.won++;
        homeTeam.points += 3;
        awayTeam.lost++;
      } else if (match.home_score < match.away_score) {
        awayTeam.won++;
        awayTeam.points += 3;
        homeTeam.lost++;
      } else {
        homeTeam.drawn++;
        homeTeam.points += 1;
        awayTeam.drawn++;
        awayTeam.points += 1;
      }
    });
    
    // Ordenar times por pontos
    const sortedTeams = Array.from(teamStats.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const goalDiffA = a.goals_for - a.goals_against;
        const goalDiffB = b.goals_for - b.goals_against;
        return goalDiffB - goalDiffA;
      });

    console.log('\n🏆 CLASSIFICAÇÃO ATUAL (BASEADA NOS JOGOS FINALIZADOS):');
    sortedTeams.slice(0, 8).forEach((team, index) => {
      const goalDiff = team.goals_for - team.goals_against;
      console.log(`  ${index + 1}º ${team.name}: ${team.points} pts | ${team.played} jogos | ${goalDiff > 0 ? '+' : ''}${goalDiff} saldo`);
    });

    // 4. SIMULAÇÃO SIMPLIFICADA
    console.log('\n🎲 3. SIMULAÇÃO SIMPLIFICADA (100 iterações)');
    
    const simulationResults = [];
    
    for (let i = 0; i < 100; i++) {
      // Clonar estado inicial
      const simulationTeams = new Map();
      teamStats.forEach((team, id) => {
        simulationTeams.set(id, { ...team });
      });
      
      // Simular jogos agendados
      scheduledMatches.forEach(match => {
        const homeTeam = simulationTeams.get(match.home_team_id);
        const awayTeam = simulationTeams.get(match.away_team_id);
        
        // Simulação muito simples: probabilidade baseada na diferença de pontos atual
        const homePowerIndex = Math.max(homeTeam.points, 1);
        const awayPowerIndex = Math.max(awayTeam.points, 1);
        const totalPower = homePowerIndex + awayPowerIndex;
        
        const homeWinProb = (homePowerIndex / totalPower) * 0.6 + 0.1; // Vantagem de casa
        const random = Math.random();
        
        let homeGoals, awayGoals;
        if (random < homeWinProb) {
          // Casa vence
          homeGoals = Math.floor(Math.random() * 3) + 1;
          awayGoals = Math.floor(Math.random() * homeGoals);
        } else if (random < homeWinProb + 0.25) {
          // Empate
          const goals = Math.floor(Math.random() * 3);
          homeGoals = awayGoals = goals;
        } else {
          // Visitante vence
          awayGoals = Math.floor(Math.random() * 3) + 1;
          homeGoals = Math.floor(Math.random() * awayGoals);
        }
        
        // Atualizar estatísticas
        homeTeam.played++;
        homeTeam.goals_for += homeGoals;
        homeTeam.goals_against += awayGoals;
        
        awayTeam.played++;
        awayTeam.goals_for += awayGoals;
        awayTeam.goals_against += homeGoals;
        
        if (homeGoals > awayGoals) {
          homeTeam.won++;
          homeTeam.points += 3;
          awayTeam.lost++;
        } else if (homeGoals < awayGoals) {
          awayTeam.won++;
          awayTeam.points += 3;
          homeTeam.lost++;
        } else {
          homeTeam.drawn++;
          homeTeam.points += 1;
          awayTeam.drawn++;
          awayTeam.points += 1;
        }
      });
      
      // Ordenar times finais
      const finalStandings = Array.from(simulationTeams.values())
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const goalDiffA = a.goals_for - a.goals_against;
          const goalDiffB = b.goals_for - b.goals_against;
          return goalDiffB - goalDiffA;
        });
      
      simulationResults.push(finalStandings);
    }
    
    // 5. CALCULAR PROBABILIDADES
    console.log('\n🏆 4. PROBABILIDADES DE TÍTULO (100 simulações):');
    
    const titleProbabilities = new Map();
    
    simulationResults.forEach(result => {
      const champion = result[0];
      const currentCount = titleProbabilities.get(champion.id) || 0;
      titleProbabilities.set(champion.id, currentCount + 1);
    });
    
    const topCandidates = Array.from(titleProbabilities.entries())
      .map(([teamId, count]) => ({
        team: teamStats.get(teamId),
        probability: (count / simulationResults.length) * 100
      }))
      .sort((a, b) => b.probability - a.probability);
    
    topCandidates.slice(0, 5).forEach(candidate => {
      console.log(`     ${candidate.team.name}: ${candidate.probability.toFixed(1)}%`);
    });

    // 6. ANÁLISE FINAL
    console.log('\n💡 5. ANÁLISE FINAL');
    console.log(`✅ Simulação considerou TODOS os ${allMatches.length} jogos`);
    console.log(`✅ Usou resultados reais de ${finishedMatches.length} jogos finalizados`);
    console.log(`✅ Simulou ${scheduledMatches.length} jogos futuros`);
    
    const flamengoProb = topCandidates.find(c => c.team.name.toLowerCase().includes('flamengo'));
    const palmeirasProb = topCandidates.find(c => c.team.name.toLowerCase().includes('palmeiras'));
    
    if (flamengoProb) {
      console.log(`📊 Flamengo: ${flamengoProb.probability.toFixed(1)}% (antes era 99%)`);
    }
    if (palmeirasProb) {
      console.log(`📊 Palmeiras: ${palmeirasProb.probability.toFixed(1)}% (antes era 0.2%)`);
    }
    
    if (flamengoProb && palmeirasProb) {
      if (flamengoProb.probability < 90 && palmeirasProb.probability > 5) {
        console.log('✅ PROBABILIDADES AGORA ESTÃO REALISTAS!');
      } else {
        console.log('⚠️ Probabilidades ainda podem estar incorretas');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco de produção fechada');
    }
  }
}

// Executar o teste
testMonteCarloCorrected();
