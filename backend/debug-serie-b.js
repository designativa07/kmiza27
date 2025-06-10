const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function debugSerieB() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 DEBUGANDO ARTILHEIROS SÉRIE B');
    console.log('===============================');
    
    // 1. Verificar competições disponíveis
    const competitions = await client.query(`
      SELECT id, name, slug, type, season 
      FROM competitions 
      ORDER BY name
    `);
    
    console.log('\n📋 COMPETIÇÕES DISPONÍVEIS:');
    competitions.rows.forEach(comp => {
      console.log(`ID: ${comp.id}, Nome: "${comp.name}", Slug: "${comp.slug}"`);
    });
    
    // 2. Verificar se existe Série B especificamente
    const serieB = await client.query(`
      SELECT id, name 
      FROM competitions 
      WHERE LOWER(name) LIKE '%série b%' OR LOWER(name) LIKE '%serie b%'
    `);
    
    console.log('\n🏆 COMPETIÇÕES SÉRIE B:');
    if (serieB.rows.length === 0) {
      console.log('❌ Nenhuma competição Série B encontrada!');
    } else {
      serieB.rows.forEach(comp => {
        console.log(`✅ ID: ${comp.id}, Nome: "${comp.name}"`);
      });
    }
    
    // 3. Verificar partidas com gols na Série B
    const serieBMatches = await client.query(`
      SELECT 
        m.id,
        c.name as competition_name,
        ht.name as home_team,
        at.name as away_team,
        m.home_team_player_stats,
        m.away_team_player_stats,
        m.status
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE c.name ILIKE '%série b%'
        AND m.status = 'finished'
        AND (m.home_team_player_stats IS NOT NULL OR m.away_team_player_stats IS NOT NULL)
      ORDER BY m.match_date
      LIMIT 5
    `);
    
    console.log('\n⚽ PARTIDAS SÉRIE B COM ESTATÍSTICAS:');
    if (serieBMatches.rows.length === 0) {
      console.log('❌ Nenhuma partida da Série B com estatísticas encontrada!');
    } else {
      serieBMatches.rows.forEach((match, index) => {
        console.log(`\n📊 Partida ${index + 1}: ${match.home_team} vs ${match.away_team}`);
        console.log(`Competição: ${match.competition_name}`);
        console.log(`Status: ${match.status}`);
        
        // Verificar estatísticas
        if (match.home_team_player_stats) {
          const homeStats = JSON.parse(match.home_team_player_stats);
          console.log(`Home Stats: ${homeStats.length} jogadores`);
          const homeGoals = homeStats.filter(s => s.goals && s.goals > 0);
          if (homeGoals.length > 0) {
            console.log(`  🥅 Gols casa: ${homeGoals.map(g => `${g.player_id}:${g.goals}g`).join(', ')}`);
          }
        }
        
        if (match.away_team_player_stats) {
          const awayStats = JSON.parse(match.away_team_player_stats);
          console.log(`Away Stats: ${awayStats.length} jogadores`);
          const awayGoals = awayStats.filter(s => s.goals && s.goals > 0);
          if (awayGoals.length > 0) {
            console.log(`  🥅 Gols fora: ${awayGoals.map(g => `${g.player_id}:${g.goals}g`).join(', ')}`);
          }
        }
      });
    }
    
    // 4. Testar lógica de filtro atual
    console.log('\n🧪 TESTANDO LÓGICA DE FILTRO:');
    const testCases = ['série b', 'serie b', 'brasileirao serie b', 'brasileirão série b'];
    
    testCases.forEach(searchTerm => {
      console.log(`\n🔍 Teste: "${searchTerm}"`);
      const normalizedCompName = searchTerm.toLowerCase();
      
      competitions.rows.forEach(comp => {
        const compName = comp.name.toLowerCase();
        const currentLogic = compName.includes(normalizedCompName) || 
                           compName.includes('brasileir') && normalizedCompName.includes('brasileir');
        
        const betterLogic = compName.includes(normalizedCompName) ||
                          (compName.includes('série b') && normalizedCompName.includes('série')) ||
                          (compName.includes('serie b') && normalizedCompName.includes('serie'));
        
        if (currentLogic || betterLogic) {
          console.log(`  ${currentLogic ? '✅' : '❌'} | ${betterLogic ? '✅' : '❌'} -> "${comp.name}"`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugSerieB(); 