const { DataSource } = require('typeorm');

async function investigateProductionData() {
  console.log('🔍 INVESTIGAÇÃO DOS DADOS CORROMPIDOS EM PRODUÇÃO');
  console.log('==================================================\n');

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

    // 1. VERIFICAR SE HÁ JOGOS FINALIZADOS
    console.log('\n🏆 1. VERIFICANDO JOGOS FINALIZADOS');
    
    const finishedMatches = await dataSource.query(`
      SELECT COUNT(*) as total_finished
      FROM matches 
      WHERE competition_id = 1 AND status = 'finished'
    `);
    
    console.log(`📊 Total de jogos finalizados: ${finishedMatches[0].total_finished}`);

    if (finishedMatches[0].total_finished > 0) {
      // Mostrar alguns jogos finalizados como exemplo
      const sampleFinishedMatches = await dataSource.query(`
        SELECT 
          m.id,
          m.match_date,
          m.home_score,
          m.away_score,
          ht.name as home_team,
          at.name as away_team,
          m.status
        FROM matches m
        INNER JOIN teams ht ON m.home_team_id = ht.id
        INNER JOIN teams at ON m.away_team_id = at.id
        WHERE m.competition_id = 1 AND m.status = 'finished'
        ORDER BY m.match_date DESC
        LIMIT 5
      `);
      
      console.log('\n📋 EXEMPLOS DE JOGOS FINALIZADOS:');
      sampleFinishedMatches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.home_team} ${match.home_score} x ${match.away_score} ${match.away_team} (${match.match_date})`);
      });
    }

    // 2. VERIFICAR DADOS DE ESTATÍSTICAS
    console.log('\n📊 2. VERIFICANDO DADOS DE ESTATÍSTICAS');
    
    const statsData = await dataSource.query(`
      SELECT * FROM competition_teams WHERE competition_id = 1 LIMIT 5
    `);
    
    console.log(`📋 Total de registros encontrados: ${statsData.length}`);
    
    if (statsData.length > 0) {
      console.log('\n📊 DETALHES DOS PRIMEIROS 5 REGISTROS:');
      statsData.forEach((record, index) => {
        console.log(`\n  ${index + 1}. Team ID: ${record.team_id}`);
        console.log(`     Points: ${record.points}`);
        console.log(`     Played: ${record.played}`);
        console.log(`     Won: ${record.won}`);
        console.log(`     Drawn: ${record.drawn}`);
        console.log(`     Lost: ${record.lost}`);
        console.log(`     Goals For: ${record.goals_for}`);
        console.log(`     Goals Against: ${record.goals_against}`);
        console.log(`     Goal Difference: ${record.goal_difference}`);
        console.log(`     Created At: ${record.created_at}`);
        console.log(`     Updated At: ${record.updated_at}`);
      });
    }

    // 3. VERIFICAR SE HÁ DADOS EM OUTRAS TABELAS
    console.log('\n🔍 3. VERIFICANDO DADOS EM OUTRAS TABELAS');
    
    // Verificar se há dados em standings
    const standingsData = await dataSource.query(`
      SELECT COUNT(*) as total_standings
      FROM standings 
      WHERE competition_id = 1
    `);
    
    console.log(`📊 Total de registros em standings: ${standingsData[0].total_standings}`);

    // Verificar se há dados em match_stats
    const matchStatsData = await dataSource.query(`
      SELECT COUNT(*) as total_match_stats
      FROM match_stats 
      WHERE match_id IN (
        SELECT id FROM matches WHERE competition_id = 1
      )
    `);
    
    console.log(`📊 Total de registros em match_stats: ${matchStatsData[0].total_match_stats}`);

    // 4. VERIFICAR SE HÁ PROBLEMAS DE INTEGRIDADE
    console.log('\n⚠️ 4. VERIFICANDO PROBLEMAS DE INTEGRIDADE');
    
    // Verificar se há times sem dados de estatísticas
    const teamsWithoutStats = await dataSource.query(`
      SELECT COUNT(*) as teams_without_stats
      FROM teams t
      LEFT JOIN competition_teams ct ON t.id = ct.team_id AND ct.competition_id = 1
      WHERE ct.team_id IS NULL
    `);
    
    console.log(`📊 Times sem dados de estatísticas: ${teamsWithoutStats[0].teams_without_stats}`);

    // Verificar se há jogos órfãos
    const orphanMatches = await dataSource.query(`
      SELECT COUNT(*) as orphan_matches
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.competition_id = 1 
        AND (ht.id IS NULL OR at.id IS NULL)
    `);
    
    console.log(`📊 Jogos órfãos (sem times): ${orphanMatches[0].orphan_matches}`);

    // 5. VERIFICAR HISTÓRICO DE ALTERAÇÕES
    console.log('\n📅 5. VERIFICANDO HISTÓRICO DE ALTERAÇÕES');
    
    // Verificar quando foi a última atualização dos dados
    const lastUpdate = await dataSource.query(`
      SELECT 
        MAX(updated_at) as last_competition_teams_update,
        MAX(created_at) as last_competition_teams_creation
      FROM competition_teams 
      WHERE competition_id = 1
    `);
    
    console.log(`📊 Última atualização de competition_teams: ${lastUpdate[0].last_competition_teams_update}`);
    console.log(`📊 Última criação de competition_teams: ${lastUpdate[0].last_competition_teams_creation}`);

    // 6. VERIFICAR SE HÁ BACKUP OU DADOS DE RESERVA
    console.log('\n💾 6. VERIFICANDO BACKUP OU DADOS DE RESERVA');
    
    // Verificar se há tabelas de backup
    const backupTables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%backup%'
        OR table_name LIKE '%old%'
        OR table_name LIKE '%temp%'
    `);
    
    if (backupTables.length > 0) {
      console.log(`📋 Tabelas de backup encontradas: ${backupTables.length}`);
      backupTables.forEach(table => {
        console.log(`     - ${table.table_name}`);
      });
    } else {
      console.log('📋 Nenhuma tabela de backup encontrada');
    }

    // 7. VERIFICAR SE HÁ TRIGGERS OU FUNÇÕES
    console.log('\n🔧 7. VERIFICANDO TRIGGERS OU FUNÇÕES');
    
    const triggers = await dataSource.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers 
      WHERE event_object_table = 'competition_teams'
        OR event_object_table = 'matches'
    `);
    
    if (triggers.length > 0) {
      console.log(`📋 Triggers encontrados: ${triggers.length}`);
      triggers.forEach(trigger => {
        console.log(`     - ${trigger.trigger_name} (${trigger.event_manipulation} em ${trigger.event_object_table})`);
      });
    } else {
      console.log('📋 Nenhum trigger encontrado');
    }

    // 8. RECOMENDAÇÕES BASEADAS NOS DADOS
    console.log('\n💡 8. RECOMENDAÇÕES BASEADAS NOS DADOS');
    
    if (finishedMatches[0].total_finished === 0) {
      console.log('🔴 PRIORIDADE ALTA: Não há jogos finalizados - dados podem ter sido perdidos');
    }
    
    if (statsData.length > 0 && statsData[0].points === 0) {
      console.log('🔴 PRIORIDADE ALTA: Estatísticas estão zeradas - sistema de atualização pode estar quebrado');
    }
    
    if (orphanMatches[0].orphan_matches > 0) {
      console.log('🟡 PRIORIDADE MÉDIA: Há jogos órfãos - problema de integridade referencial');
    }
    
    if (backupTables.length > 0) {
      console.log('🟢 OPORTUNIDADE: Há tabelas de backup - possível restaurar dados');
    }

    // 9. SUGESTÕES DE CORREÇÃO
    console.log('\n🛠️ 9. SUGESTÕES DE CORREÇÃO');
    
    if (finishedMatches[0].total_finished > 0) {
      console.log('✅ Recálculo automático: Usar jogos finalizados para recalcular estatísticas');
    } else {
      console.log('❌ Dados perdidos: Necessário restaurar de backup ou reimportar');
    }
    
    if (statsData.length === 0) {
      console.log('❌ Tabela vazia: Necessário recriar dados de estatísticas');
    }
    
    console.log('✅ Verificar sistema de atualização automática');
    console.log('✅ Implementar monitoramento de integridade dos dados');
    console.log('✅ Criar backup automático antes de operações críticas');

  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco de produção fechada');
    }
  }
}

// Executar a investigação
investigateProductionData();
