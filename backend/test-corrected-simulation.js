const { Client } = require('pg');

async function testCorrectedSimulation() {
  console.log('🧪 TESTANDO SIMULAÇÕES CORRIGIDAS');
  console.log('==================================\n');

  // Configuração para BASE LOCAL
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'kmiza27_dev',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados LOCAL (kmiza27_dev)');

    // 1. VERIFICAR SE EXISTEM SIMULAÇÕES ANTERIORES
    console.log('\n🔍 1. VERIFICANDO SIMULAÇÕES EXISTENTES');
    
    const existingSimulations = await client.query(`
      SELECT 
        id,
        execution_date,
        algorithm_version,
        is_latest
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
      LIMIT 3
    `);
    
    console.log(`📊 Simulações existentes: ${existingSimulations.rows.length}`);
    existingSimulations.rows.forEach((sim, index) => {
      console.log(`  ${index + 1}. ID: ${sim.id} | Versão: ${sim.algorithm_version} | Mais recente: ${sim.is_latest ? '✅' : '❌'}`);
    });

    // 2. VERIFICAR CLASSIFICAÇÃO ATUAL
    console.log('\n🏆 2. VERIFICANDO CLASSIFICAÇÃO ATUAL');
    
    const currentStandings = await client.query(`
      SELECT 
        ct.team_id,
        t.name as team_name,
        ct.points,
        ct.played,
        ct.won,
        ct.drawn,
        ct.lost
      FROM competition_teams ct
      INNER JOIN teams t ON ct.team_id = t.id
      WHERE ct.competition_id = 1
      ORDER BY ct.points DESC, ct.goal_difference DESC
      LIMIT 20
    `);
    
    console.log('📊 TOP 5 CLASSIFICAÇÃO ATUAL:');
    currentStandings.rows.slice(0, 5).forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.points}pts (${team.played}J, ${team.won}V, ${team.drawn}E, ${team.lost}D)`);
    });

    console.log('\n📊 ZONA DE REBAIXAMENTO:');
    currentStandings.rows.slice(-4).forEach((team, index) => {
      const position = currentStandings.rows.length - 3 + index;
      console.log(`  ${position}. ${team.team_name}: ${team.points}pts (${team.played}J, ${team.won}V, ${team.drawn}E, ${team.lost}D)`);
    });

    // 3. VERIFICAR JOGOS RESTANTES
    console.log('\n⚽ 3. VERIFICANDO JOGOS RESTANTES');
    
    const remainingMatches = await client.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finished
      FROM matches m
      WHERE m.competition_id = 1
    `);
    
    console.log(`📊 Total de jogos: ${remainingMatches.rows[0].total_matches}`);
    console.log(`📋 Jogos finalizados: ${remainingMatches.rows[0].finished}`);
    console.log(`📋 Jogos restantes: ${remainingMatches.rows[0].scheduled}`);
    console.log(`📋 Progresso: ${((remainingMatches.rows[0].finished / remainingMatches.rows[0].total_matches) * 100).toFixed(1)}%`);

    // 4. ANÁLISE DAS CORREÇÕES IMPLEMENTADAS
    console.log('\n🔧 4. ANÁLISE DAS CORREÇÕES IMPLEMENTADAS');
    
    console.log('✅ CORREÇÕES IMPLEMENTADAS:');
    console.log('   • Power Index: Pesos rebalanceados (45% desempenho, 25% gols, 30% forma)');
    console.log('   • Normalização: 2.5 pts/jogo = 100% (mais realista)');
    console.log('   • Força relativa: Divisor aumentado para 100 (diferenças menores)');
    console.log('   • Vantagem de casa: Reduzida para 20% (mais realista)');
    console.log('   • Volatilidade: Aumentada para 35% (futebol é imprevisível)');
    console.log('   • Fator de esperança: Bônus para times na zona de rebaixamento');

    // 5. PREVISÕES COM AS CORREÇÕES
    console.log('\n🎯 5. PREVISÕES COM AS CORREÇÕES');
    
    console.log('📊 PROBABILIDADES ESPERADAS (mais realistas):');
    console.log('   • Flamengo: ~45-55% (não mais 78,8%)');
    console.log('   • Palmeiras: ~25-35% (não mais 19,1%)');
    console.log('   • Cruzeiro: ~15-25% (não mais 1,9%)');
    console.log('   • Sport: ~60-75% risco (não mais 99,7%)');
    console.log('   • Fortaleza: ~70-85% risco (não mais 94,6%)');

    // 6. RECOMENDAÇÕES PARA TESTE
    console.log('\n💡 6. RECOMENDAÇÕES PARA TESTE');
    
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('   1. Executar nova simulação com algoritmo corrigido');
    console.log('   2. Verificar se probabilidades estão mais realistas');
    console.log('   3. Confirmar que soma de rebaixamento = 100%');
    console.log('   4. Validar que Sport tem chance realista de recuperação');

    console.log('\n🎲 PARA EXECUTAR NOVA SIMULAÇÃO:');
    console.log('   • Acessar painel de simulações no frontend');
    console.log('   • Selecionar "Brasileirão Série A"');
    console.log('   • Definir 5.000 simulações');
    console.log('   • Clicar em "Executar Simulação"');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar o teste
testCorrectedSimulation();
