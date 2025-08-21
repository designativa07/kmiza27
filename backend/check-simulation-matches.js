const { DataSource } = require('typeorm');

async function checkSimulationMatches() {
  console.log('🔍 VERIFICANDO JOGOS CONSIDERADOS PELA SIMULAÇÃO MONTE CARLO');
  console.log('================================================================\n');

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

    // 1. VERIFICAR TOTAL DE JOGOS DO BRASILEIRÃO
    console.log('🏆 1. TOTAL DE JOGOS DO BRASILEIRÃO');
    
    const totalMatches = await dataSource.query(`
      SELECT COUNT(*) as total_matches
      FROM matches 
      WHERE competition_id = 1
    `);
    
    console.log(`📊 Total de jogos cadastrados: ${totalMatches[0].total_matches}`);

    // 2. VERIFICAR JOGOS POR STATUS
    console.log('\n📊 2. JOGOS POR STATUS');
    
    const matchesByStatus = await dataSource.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM matches 
      WHERE competition_id = 1
      GROUP BY status
      ORDER BY count DESC
    `);
    
    matchesByStatus.forEach(status => {
      console.log(`     ${status.status}: ${status.count} jogos`);
    });

    // 3. VERIFICAR JOGOS CONSIDERADOS PELA SIMULAÇÃO (SCHEDULED)
    console.log('\n🎯 3. JOGOS CONSIDERADOS PELA SIMULAÇÃO MONTE CARLO');
    
    const simulationMatches = await dataSource.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        ht.name as home_team,
        at.name as away_team,
        r.name as round_name,
        r.round_number
      FROM matches m
      INNER JOIN teams ht ON m.home_team_id = ht.id
      INNER JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE m.competition_id = 1 
        AND m.status = 'scheduled'
      ORDER BY m.match_date ASC
    `);
    
    console.log(`📊 Total de jogos para simulação: ${simulationMatches.length}`);
    
    if (simulationMatches.length > 0) {
      console.log('\n📋 PRIMEIROS 10 JOGOS PARA SIMULAÇÃO:');
      simulationMatches.slice(0, 10).forEach((match, index) => {
        const date = new Date(match.match_date).toLocaleDateString('pt-BR');
        console.log(`  ${index + 1}. ${match.home_team} vs ${match.away_team} (${date}) - ${match.round_name || 'Sem rodada'}`);
      });
      
      if (simulationMatches.length > 10) {
        console.log(`     ... e mais ${simulationMatches.length - 10} jogos`);
      }
    }

    // 4. VERIFICAR RODADAS CADASTRADAS
    console.log('\n🏁 4. RODADAS CADASTRADAS');
    
    const rounds = await dataSource.query(`
      SELECT 
        r.id,
        r.name,
        r.round_number,
        COUNT(m.id) as matches_count
      FROM rounds r
      LEFT JOIN matches m ON r.id = m.round_id AND m.competition_id = 1
      WHERE r.competition_id = 1
      GROUP BY r.id, r.name, r.round_number
      ORDER BY r.round_number ASC, r.name ASC
    `);
    
    console.log(`📊 Total de rodadas cadastradas: ${rounds.length}`);
    
    if (rounds.length > 0) {
      console.log('\n📋 RODADAS E JOGOS:');
      rounds.forEach(round => {
        console.log(`     ${round.name} (${round.round_number || 'N/A'}): ${round.matches_count} jogos`);
      });
    }

    // 5. VERIFICAR SE HÁ JOGOS FUTUROS MUITO DISTANTES
    console.log('\n⏰ 5. VERIFICAÇÃO DE DATAS FUTURAS');
    
    const futureMatches = await dataSource.query(`
      SELECT 
        m.match_date,
        ht.name as home_team,
        at.name as away_team,
        r.name as round_name
      FROM matches m
      INNER JOIN teams ht ON m.home_team_id = ht.id
      INNER JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE m.competition_id = 1 
        AND m.status = 'scheduled'
        AND m.match_date > NOW() + INTERVAL '30 days'
      ORDER BY m.match_date ASC
      LIMIT 5
    `);
    
    if (futureMatches.length > 0) {
      console.log(`📊 Jogos muito futuros (>30 dias): ${futureMatches.length}`);
      console.log('\n📋 EXEMPLOS DE JOGOS FUTUROS:');
      futureMatches.forEach(match => {
        const date = new Date(match.match_date).toLocaleDateString('pt-BR');
        console.log(`     ${match.home_team} vs ${match.away_team} (${date}) - ${match.round_name || 'Sem rodada'}`);
      });
    } else {
      console.log('📊 Nenhum jogo muito futuro encontrado');
    }

    // 6. ANÁLISE FINAL
    console.log('\n💡 6. ANÁLISE FINAL');
    
    const expectedMatches = 20 * 19; // 20 times, cada um joga contra os outros 19
    console.log(`📊 Jogos esperados em 38 rodadas: ${expectedMatches}`);
    console.log(`📊 Jogos cadastrados: ${totalMatches[0].total_matches}`);
    console.log(`📊 Jogos para simulação: ${simulationMatches.length}`);
    
    if (simulationMatches.length === expectedMatches) {
      console.log('✅ SIMULAÇÃO CONSIDERANDO TODOS OS JOGOS (38 rodadas completas)');
    } else if (simulationMatches.length > expectedMatches) {
      console.log('⚠️ SIMULAÇÃO CONSIDERANDO MAIS JOGOS QUE O ESPERADO (possível duplicação)');
    } else {
      console.log('❌ SIMULAÇÃO CONSIDERANDO MENOS JOGOS QUE O ESPERADO (rodadas incompletas)');
    }

    // 7. RECOMENDAÇÕES
    console.log('\n🛠️ 7. RECOMENDAÇÕES');
    
    if (simulationMatches.length === expectedMatches) {
      console.log('✅ Sistema funcionando corretamente - considerando todas as 38 rodadas');
      console.log('✅ Simulação Monte Carlo deve ser precisa');
    } else {
      console.log('🔧 Verificar se todas as rodadas estão cadastradas corretamente');
      console.log('🔧 Verificar se há jogos duplicados ou faltando');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco de produção fechada');
    }
  }
}

// Executar a verificação
checkSimulationMatches();
