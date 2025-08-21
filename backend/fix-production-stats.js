const { DataSource } = require('typeorm');

async function fixProductionStats() {
  console.log('🔧 CORRIGINDO ESTATÍSTICAS CORROMPIDAS EM PRODUÇÃO');
  console.log('=====================================================\n');

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

    // 1. VERIFICAR TIMES DO BRASILEIRÃO
    console.log('\n🏆 1. VERIFICANDO TIMES DO BRASILEIRÃO');
    
    const teams = await dataSource.query(`
      SELECT DISTINCT 
        t.id,
        t.name,
        t.short_name
      FROM teams t
      INNER JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
      WHERE m.competition_id = 1
      ORDER BY t.name
    `);
    
    console.log(`📊 Total de times encontrados: ${teams.length}`);
    teams.forEach(team => {
      console.log(`     - ${team.name} (ID: ${team.id})`);
    });

    // 2. RECALCULAR ESTATÍSTICAS PARA CADA TIME
    console.log('\n🔄 2. RECALCULANDO ESTATÍSTICAS');
    
    for (const team of teams) {
      console.log(`\n📊 Calculando estatísticas para: ${team.name}`);
      
      // Calcular estatísticas baseado nos jogos finalizados
      const stats = await dataSource.query(`
        SELECT 
          COUNT(*) as total_matches,
          COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as played,
          COUNT(CASE WHEN m.status = 'finished' AND (
            (m.home_team_id = $1 AND m.home_score > m.away_score) OR
            (m.away_team_id = $1 AND m.away_score > m.home_score)
          ) THEN 1 END) as won,
          COUNT(CASE WHEN m.status = 'finished' AND m.home_score = m.away_score THEN 1 END) as drawn,
          COUNT(CASE WHEN m.status = 'finished' AND (
            (m.home_team_id = $1 AND m.home_score < m.away_score) OR
            (m.away_team_id = $1 AND m.away_score < m.home_score)
          ) THEN 1 END) as lost,
          SUM(CASE WHEN m.status = 'finished' THEN
            CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END
          END) as goals_for,
          SUM(CASE WHEN m.status = 'finished' THEN
            CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.home_score END
          END) as goals_against
        FROM matches m
        WHERE m.competition_id = 1 
          AND (m.home_team_id = $1 OR m.away_team_id = $1)
      `, [team.id]);
      
      const teamStats = stats[0];
      const points = (teamStats.won * 3) + (teamStats.drawn * 1);
      const goalDifference = (teamStats.goals_for || 0) - (teamStats.goals_against || 0);
      
      console.log(`     Jogos: ${teamStats.played}`);
      console.log(`     Vitórias: ${teamStats.won}`);
      console.log(`     Empates: ${teamStats.drawn}`);
      console.log(`     Derrotas: ${teamStats.lost}`);
      console.log(`     Gols pró: ${teamStats.goals_for || 0}`);
      console.log(`     Gols contra: ${teamStats.goals_against || 0}`);
      console.log(`     Saldo: ${goalDifference}`);
      console.log(`     Pontos: ${points}`);
      
      // 3. ATUALIZAR TABELA COMPETITION_TEAMS
      console.log(`     🔄 Atualizando banco de dados...`);
      
      await dataSource.query(`
        UPDATE competition_teams 
        SET 
          points = $1,
          played = $2,
          won = $3,
          drawn = $4,
          lost = $5,
          goals_for = $6,
          goals_against = $7,
          updated_at = NOW()
        WHERE competition_id = 1 AND team_id = $8
      `, [
        points,
        teamStats.played,
        teamStats.won,
        teamStats.drawn,
        teamStats.lost,
        teamStats.goals_for || 0,
        teamStats.goals_against || 0,
        team.id
      ]);
      
      console.log(`     ✅ ${team.name} atualizado com sucesso!`);
    }

    // 4. VERIFICAR RESULTADO FINAL
    console.log('\n📊 3. VERIFICANDO RESULTADO FINAL');
    
    const finalStats = await dataSource.query(`
      SELECT 
        t.name,
        ct.points,
        ct.played,
        ct.won,
        ct.drawn,
        ct.lost,
        ct.goals_for,
        ct.goals_against,
        ct.goal_difference
      FROM competition_teams ct
      INNER JOIN teams t ON ct.team_id = t.id
      WHERE ct.competition_id = 1
      ORDER BY ct.points DESC, ct.goal_difference DESC, ct.goals_for DESC
    `);
    
    console.log('\n🏆 CLASSIFICAÇÃO ATUALIZADA:');
    finalStats.forEach((team, index) => {
      console.log(`\n  ${index + 1}º ${team.name}`);
      console.log(`     ${team.points} pontos | ${team.played} jogos | ${team.won}V ${team.drawn}E ${team.lost}D`);
      console.log(`     Gols: ${team.goals_for} pró, ${team.goals_against} contra (${team.goal_difference > 0 ? '+' : ''}${team.goal_difference})`);
    });

    // 5. VERIFICAR SE AS ESTATÍSTICAS FAZEM SENTIDO
    console.log('\n🔍 4. VERIFICAÇÃO DE INTEGRIDADE');
    
    const totalPoints = finalStats.reduce((sum, team) => sum + team.points, 0);
    const totalMatches = finalStats.reduce((sum, team) => sum + team.played, 0);
    
    console.log(`📊 Total de pontos distribuídos: ${totalPoints}`);
    console.log(`📊 Total de jogos disputados: ${totalMatches}`);
    
    if (totalMatches > 0) {
      const avgPointsPerMatch = totalPoints / totalMatches;
      console.log(`📊 Média de pontos por jogo: ${avgPointsPerMatch.toFixed(2)}`);
      
      if (Math.abs(avgPointsPerMatch - 3) < 0.1) {
        console.log('✅ Média de pontos está correta (~3 pontos por jogo)');
      } else {
        console.log('⚠️ Média de pontos pode estar incorreta');
      }
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ Estatísticas recalculadas baseadas nos jogos finalizados');
    console.log('✅ Simulação Monte Carlo agora deve funcionar corretamente');
    console.log('✅ Probabilidades devem ser realistas');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco de produção fechada');
    }
  }
}

// Executar a correção
fixProductionStats();
