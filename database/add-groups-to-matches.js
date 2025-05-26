const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function addGroupsToMatches() {
  const client = await pool.connect();
  
  try {
    console.log('🏆 Adicionando grupos às competições internacionais...\n');
    
    // 1. Verificar se a coluna group_name existe
    try {
      await client.query('SELECT group_name FROM matches LIMIT 1');
      console.log('✅ Coluna group_name já existe');
    } catch (error) {
      console.log('📋 Adicionando coluna group_name...');
      await client.query('ALTER TABLE matches ADD COLUMN group_name VARCHAR(10)');
      console.log('✅ Coluna group_name adicionada');
    }

    // 2. Verificar se a coluna phase existe
    try {
      await client.query('SELECT phase FROM matches LIMIT 1');
      console.log('✅ Coluna phase já existe');
    } catch (error) {
      console.log('📋 Adicionando coluna phase...');
      await client.query('ALTER TABLE matches ADD COLUMN phase VARCHAR(50)');
      console.log('✅ Coluna phase adicionada');
    }

    // 3. Atualizar jogos da Copa Libertadores com grupos
    console.log('\n🏆 Atualizando jogos da Copa Libertadores...');
    const libertadoresMatches = await client.query(`
      SELECT m.id, ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Copa Libertadores'
      AND m.group_name IS NULL
      ORDER BY m.id
    `);

    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const phases = ['Fase de Grupos', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];
    
    let libertadoresUpdated = 0;
    for (let i = 0; i < libertadoresMatches.rows.length; i++) {
      const match = libertadoresMatches.rows[i];
      const group = groups[i % groups.length];
      const phase = phases[Math.floor(i / 20) % phases.length]; // Distribuir pelas fases
      
      await client.query(`
        UPDATE matches 
        SET group_name = $1, phase = $2, updated_at = NOW()
        WHERE id = $3
      `, [group, phase, match.id]);
      
      libertadoresUpdated++;
    }
    console.log(`✅ ${libertadoresUpdated} jogos da Libertadores atualizados com grupos`);

    // 4. Atualizar jogos da Copa Sul-Americana com grupos
    console.log('\n🥈 Atualizando jogos da Copa Sul-Americana...');
    const sulamericanaMatches = await client.query(`
      SELECT m.id, ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Copa Sul-Americana'
      AND m.group_name IS NULL
      ORDER BY m.id
    `);

    let sulamericanaUpdated = 0;
    for (let i = 0; i < sulamericanaMatches.rows.length; i++) {
      const match = sulamericanaMatches.rows[i];
      const group = groups[i % 4]; // Sul-Americana tem menos grupos
      const phase = phases[Math.floor(i / 16) % phases.length];
      
      await client.query(`
        UPDATE matches 
        SET group_name = $1, phase = $2, updated_at = NOW()
        WHERE id = $3
      `, [group, phase, match.id]);
      
      sulamericanaUpdated++;
    }
    console.log(`✅ ${sulamericanaUpdated} jogos da Sul-Americana atualizados com grupos`);

    // 5. Atualizar jogos do Mundial de Clubes com grupos
    console.log('\n🌍 Atualizando jogos do Mundial de Clubes...');
    const mundialMatches = await client.query(`
      SELECT m.id, ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name = 'Mundial de Clubes'
      AND m.group_name IS NULL
      ORDER BY m.id
    `);

    let mundialUpdated = 0;
    for (let i = 0; i < mundialMatches.rows.length; i++) {
      const match = mundialMatches.rows[i];
      const group = groups[i % 4]; // Mundial tem 4 grupos
      const phase = phases[Math.floor(i / 12) % phases.length];
      
      await client.query(`
        UPDATE matches 
        SET group_name = $1, phase = $2, updated_at = NOW()
        WHERE id = $3
      `, [group, phase, match.id]);
      
      mundialUpdated++;
    }
    console.log(`✅ ${mundialUpdated} jogos do Mundial atualizados com grupos`);

    // 6. Verificar resultados
    console.log('\n📊 Verificando grupos adicionados...');
    const groupStats = await client.query(`
      SELECT 
        c.name as competition,
        m.group_name,
        m.phase,
        COUNT(*) as matches_count
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      WHERE c.name IN ('Copa Libertadores', 'Copa Sul-Americana', 'Mundial de Clubes')
      AND m.group_name IS NOT NULL
      GROUP BY c.name, m.group_name, m.phase
      ORDER BY c.name, m.group_name, m.phase
    `);

    console.log('\n🏆 GRUPOS POR COMPETIÇÃO:');
    console.log('========================');
    
    let currentComp = '';
    groupStats.rows.forEach(stat => {
      if (stat.competition !== currentComp) {
        console.log(`\n📋 ${stat.competition}:`);
        currentComp = stat.competition;
      }
      console.log(`   Grupo ${stat.group_name} - ${stat.phase}: ${stat.matches_count} jogos`);
    });

    // 7. Estatísticas finais
    const finalStats = await client.query(`
      SELECT 
        c.name as competition,
        COUNT(m.id) as total_matches,
        COUNT(CASE WHEN m.group_name IS NOT NULL THEN 1 END) as matches_with_groups
      FROM competitions c
      LEFT JOIN matches m ON c.id = m.competition_id
      WHERE c.name IN ('Copa Libertadores', 'Copa Sul-Americana', 'Mundial de Clubes')
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    console.log('\n📈 RESUMO FINAL:');
    console.log('===============');
    finalStats.rows.forEach(stat => {
      const percentage = stat.total_matches > 0 ? Math.round((stat.matches_with_groups / stat.total_matches) * 100) : 0;
      console.log(`🏆 ${stat.competition}:`);
      console.log(`   Total de jogos: ${stat.total_matches}`);
      console.log(`   Jogos com grupos: ${stat.matches_with_groups} (${percentage}%)`);
      console.log('');
    });

    console.log('🎉 Grupos adicionados com sucesso às competições internacionais!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar grupos:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
addGroupsToMatches().catch(console.error); 