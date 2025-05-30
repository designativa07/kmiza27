import { Pool } from 'pg';

interface Match {
  id: number;
  home_team: string;
  away_team: string;
  round_name: string | null;
  match_date: Date;
  status: string;
}

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function checkRounds() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando associação de rodadas aos jogos...');
    
    // Buscar ID da competição Brasileirão
    const competition = await client.query(`
      SELECT id, name FROM competitions 
      WHERE name = 'Brasileirão'
    `);
    
    if (competition.rows.length === 0) {
      console.log('❌ Competição Brasileirão não encontrada');
      return;
    }
    
    const competitionId = competition.rows[0].id;
    console.log(`✅ Competição encontrada: ${competition.rows[0].name} (ID: ${competitionId})`);
    
    // Buscar jogos e suas rodadas
    const matches = await client.query<Match>(`
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        r.name as round_name,
        m.match_date,
        m.status
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE m.competition_id = $1
      ORDER BY m.match_date
    `, [competitionId]);
    
    console.log(`\n📊 Total de jogos encontrados: ${matches.rows.length}`);
    
    // Agrupar jogos por rodada
    const matchesByRound: Record<string, Match[]> = {};
    const matchesWithoutRound: Match[] = [];
    
    matches.rows.forEach(match => {
      if (match.round_name) {
        if (!matchesByRound[match.round_name]) {
          matchesByRound[match.round_name] = [];
        }
        matchesByRound[match.round_name].push(match);
      } else {
        matchesWithoutRound.push(match);
      }
    });
    
    // Exibir resultados
    console.log('\n📋 Distribuição de jogos por rodada:');
    Object.entries(matchesByRound)
      .sort((a, b) => {
        const roundA = parseInt(a[0].match(/\d+/)?.[0] || '0');
        const roundB = parseInt(b[0].match(/\d+/)?.[0] || '0');
        return roundA - roundB;
      })
      .forEach(([round, matches]) => {
        console.log(`\n${round}: ${matches.length} jogos`);
        matches.forEach(match => {
          const date = new Date(match.match_date).toLocaleDateString('pt-BR');
          console.log(`  - ${match.home_team} vs ${match.away_team} (${date})`);
        });
      });
    
    if (matchesWithoutRound.length > 0) {
      console.log('\n⚠️ Jogos sem rodada associada:');
      matchesWithoutRound.forEach(match => {
        const date = new Date(match.match_date).toLocaleDateString('pt-BR');
        console.log(`  - ${match.home_team} vs ${match.away_team} (${date})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar rodadas:', error);
  } finally {
    await client.end();
  }
}

checkRounds().catch(console.error); 