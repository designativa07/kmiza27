const { DataSource } = require('typeorm');

async function testSimulationQuery() {
  console.log('🔍 TESTANDO QUERY DA SIMULAÇÃO MONTE CARLO');
  console.log('==========================================\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'kmiza27_dev',
    entities: [], // Não usar entidades para evitar problemas
    synchronize: false,
    logging: true, // Habilitar logs para ver a query SQL
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar competições disponíveis
    console.log('\n🏆 1. VERIFICANDO COMPETIÇÕES DISPONÍVEIS');
    const competitions = await dataSource.query(`
      SELECT id, name, slug, type 
      FROM competitions 
      ORDER BY name
    `);
    
    console.log(`Total de competições: ${competitions.length}`);
    competitions.forEach(comp => {
      console.log(`  - ID: ${comp.id}, Nome: ${comp.name}, Slug: ${comp.slug}, Tipo: ${comp.type}`);
    });

    // 2. Buscar especificamente o Brasileirão Série A
    console.log('\n⚽ 2. BUSCANDO BRASILEIRÃO SÉRIE A');
    const brasileirao = await dataSource.query(`
      SELECT id, name, slug, type 
      FROM competitions 
      WHERE LOWER(name) LIKE LOWER('%brasileir%')
         OR LOWER(slug) LIKE LOWER('%brasileir%')
      LIMIT 1
    `);
    
    if (!brasileirao || brasileirao.length === 0) {
      console.log('❌ Brasileirão não encontrado!');
      return;
    }
    
    const comp = brasileirao[0];
    console.log(`✅ Brasileirão encontrado: ID ${comp.id} - ${comp.name}`);

    // 3. Testar a query exata da simulação
    console.log('\n🎯 3. TESTANDO QUERY DA SIMULAÇÃO (findRemainingMatches)');
    
    // Query exata que está sendo usada na simulação
    const remainingMatches = await dataSource.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        m.group_name,
        m.phase,
        c.name as competition_name,
        c.id as competition_id,
        ht.name as home_team_name,
        ht.id as home_team_id,
        at.name as away_team_name,
        at.id as away_team_id,
        r.name as round_name
      FROM matches m
      INNER JOIN competitions c ON m.competition_id = c.id
      INNER JOIN teams ht ON m.home_team_id = ht.id
      INNER JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE m.competition_id = $1 
        AND m.status = 'scheduled'
      ORDER BY m.match_date ASC
    `, [comp.id]);

    console.log(`📊 Total de partidas restantes encontradas: ${remainingMatches.length}`);

    if (remainingMatches.length > 0) {
      console.log('\n📋 DETALHES DAS PARTIDAS:');
      remainingMatches.forEach((match, index) => {
        console.log(`\n  ${index + 1}. ${match.home_team_name} vs ${match.away_team_name}`);
        console.log(`     Data: ${match.match_date}`);
        console.log(`     Status: ${match.status}`);
        console.log(`     Competição: ${match.competition_name} (ID: ${match.competition_id})`);
        console.log(`     Round: ${match.round_name || 'N/A'}`);
        console.log(`     Group: ${match.group_name || 'N/A'}`);
        console.log(`     Phase: ${match.phase || 'N/A'}`);
      });
    }

    // 4. Verificar se há partidas de outras competições com status 'scheduled'
    console.log('\n🔍 4. VERIFICANDO PARTIDAS DE OUTRAS COMPETIÇÕES');
    
    const allScheduledMatches = await dataSource.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        c.name as competition_name,
        c.id as competition_id,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM matches m
      INNER JOIN competitions c ON m.competition_id = c.id
      INNER JOIN teams ht ON m.home_team_id = ht.id
      INNER JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'scheduled'
      ORDER BY m.match_date ASC
    `);

    console.log(`📊 Total de partidas agendadas em TODAS as competições: ${allScheduledMatches.length}`);

    // Agrupar por competição
    const matchesByCompetition = {};
    allScheduledMatches.forEach(match => {
      const compName = match.competition_name;
      if (!matchesByCompetition[compName]) {
        matchesByCompetition[compName] = [];
      }
      matchesByCompetition[compName].push(match);
    });

    console.log('\n📋 DISTRIBUIÇÃO POR COMPETIÇÃO:');
    Object.keys(matchesByCompetition).forEach(compName => {
      console.log(`  - ${compName}: ${matchesByCompetition[compName].length} partidas`);
    });

    // 5. Verificar se há problemas na estrutura da tabela
    console.log('\n🔧 5. VERIFICANDO ESTRUTURA DA TABELA MATCHES');
    
    const tableStructure = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
        AND column_name IN ('competition_id', 'status', 'match_date')
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura das colunas críticas:');
    tableStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 6. Verificar se há dados inconsistentes
    console.log('\n⚠️ 6. VERIFICANDO DADOS INCONSISTENTES');
    
    const inconsistentMatches = await dataSource.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        c.name as competition_name,
        c.id as competition_id,
        ht.name as home_team,
        at.name as away_team
      FROM matches m
      LEFT JOIN competitions c ON m.competition_id = c.id
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'scheduled'
        AND (m.competition_id IS NULL OR c.id IS NULL)
      ORDER BY m.match_date
    `);
    
    if (inconsistentMatches.length > 0) {
      console.log(`❌ Encontradas ${inconsistentMatches.length} partidas com dados inconsistentes:`);
      inconsistentMatches.forEach(match => {
        console.log(`  - ID: ${match.id}, Data: ${match.match_date}, Comp: ${match.competition_name || 'NULL'}`);
      });
    } else {
      console.log('✅ Nenhuma inconsistência encontrada na estrutura dos dados');
    }

    // 7. Verificar se há partidas com competition_id incorreto
    console.log('\n🔍 7. VERIFICANDO PARTIDAS COM COMPETITION_ID INCORRETO');
    
    const wrongCompetitionMatches = await dataSource.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        m.competition_id,
        c.name as competition_name,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM matches m
      INNER JOIN competitions c ON m.competition_id = c.id
      INNER JOIN teams ht ON m.home_team_id = ht.id
      INNER JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'scheduled'
        AND m.competition_id != $1
      ORDER BY m.competition_id, m.match_date
    `, [comp.id]);
    
    if (wrongCompetitionMatches.length > 0) {
      console.log(`⚠️ Encontradas ${wrongCompetitionMatches.length} partidas de OUTRAS competições:`);
      
      // Agrupar por competição
      const wrongByCompetition = {};
      wrongCompetitionMatches.forEach(match => {
        const compName = match.competition_name;
        if (!wrongByCompetition[compName]) {
          wrongByCompetition[compName] = [];
        }
        wrongByCompetition[compName].push(match);
      });
      
      Object.keys(wrongByCompetition).forEach(compName => {
        console.log(`\n  ${compName} (${wrongByCompetition[compName].length} partidas):`);
        wrongByCompetition[compName].slice(0, 3).forEach(match => {
          console.log(`    - ${match.home_team_name} vs ${match.away_team_name} (${match.match_date})`);
        });
        if (wrongByCompetition[compName].length > 3) {
          console.log(`    ... e mais ${wrongByCompetition[compName].length - 3} partidas`);
        }
      });
    } else {
      console.log('✅ Nenhuma partida de outras competições encontrada');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

// Executar o teste
testSimulationQuery();
