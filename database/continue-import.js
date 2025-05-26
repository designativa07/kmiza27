const { Pool } = require('pg');
const fs = require('fs');

// Configuração do banco PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function continueImport() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Continuando importação dos dados...');
    
    // 1. Importar Jogos (Matches)
    console.log('⚽ Importando jogos...');
    await importMatches(client);
    
    console.log('✅ Importação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

async function importMatches(client) {
  // Buscar IDs das competições, times e estádios
  const competitions = await client.query('SELECT id, name FROM competitions');
  const teams = await client.query('SELECT id, name FROM teams');
  const stadiums = await client.query('SELECT id, name FROM stadiums');
  const rounds = await client.query('SELECT id, name, competition_id FROM rounds');

  const competitionMap = {};
  competitions.rows.forEach(comp => {
    competitionMap[comp.name] = comp.id;
  });

  const teamMap = {};
  teams.rows.forEach(team => {
    teamMap[team.name] = team.id;
  });

  const stadiumMap = {};
  stadiums.rows.forEach(stadium => {
    stadiumMap[stadium.name] = stadium.id;
  });

  const roundMap = {};
  rounds.rows.forEach(round => {
    roundMap[`${round.competition_id}-${round.name}`] = round.id;
  });

  // Dados de jogos do Brasileirão Série A (próximos jogos da Rodada 10)
  const matchesData = [
    {
      competition: 'Brasileirão Série A',
      home_team: 'Fluminense',
      away_team: 'Vasco da Gama',
      match_date: '2025-05-24 18:30:00',
      stadium: 'Maracanã',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        tv: ['Globo'],
        streaming: ['CazéTV', 'Globoplay'],
        cable: ['SporTV']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Botafogo',
      away_team: 'Ceará',
      match_date: '2025-05-24 16:00:00',
      stadium: 'Estádio Nilton Santos',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['Premiere'],
        streaming: ['Amazon Prime Video']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Palmeiras',
      away_team: 'Flamengo',
      match_date: '2025-05-25 16:00:00',
      stadium: 'Allianz Parque',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        tv: ['Globo'],
        cable: ['SporTV', 'Premiere'],
        streaming: ['Globoplay']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'São Paulo',
      away_team: 'Mirassol',
      match_date: '2025-05-24 18:30:00',
      stadium: 'MorumBIS',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['Premiere'],
        streaming: ['CazéTV']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'RB Bragantino',
      away_team: 'Juventude',
      match_date: '2025-05-26 20:00:00',
      stadium: 'Nabi Abi Chedid',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['Premiere'],
        streaming: ['Amazon Prime Video']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Atlético-MG',
      away_team: 'Corinthians',
      match_date: '2025-05-24 21:00:00',
      stadium: 'Arena MRV',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['SporTV', 'Premiere'],
        streaming: ['Globoplay']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Grêmio',
      away_team: 'Bahia',
      match_date: '2025-05-25 11:00:00',
      stadium: 'Arena do Grêmio',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['SporTV'],
        streaming: ['CazéTV']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Vitória',
      away_team: 'Santos',
      match_date: '2025-05-25 18:30:00',
      stadium: 'Barradão',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['Premiere'],
        streaming: ['Amazon Prime Video']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Fortaleza',
      away_team: 'Cruzeiro',
      match_date: '2025-05-25 20:30:00',
      stadium: 'Castelão',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['SporTV'],
        streaming: ['CazéTV']
      }
    },
    {
      competition: 'Brasileirão Série A',
      home_team: 'Sport',
      away_team: 'Internacional',
      match_date: '2025-05-25 16:00:00',
      stadium: 'Ilha do Retiro',
      round: 'Rodada 10',
      status: 'scheduled',
      broadcast_channels: {
        cable: ['Premiere'],
        streaming: ['Amazon Prime Video']
      }
    }
  ];

  for (const match of matchesData) {
    try {
      const competitionId = competitionMap[match.competition];
      const homeTeamId = teamMap[match.home_team];
      const awayTeamId = teamMap[match.away_team];
      const stadiumId = stadiumMap[match.stadium];
      const roundId = roundMap[`${competitionId}-${match.round}`];

      if (!competitionId || !homeTeamId || !awayTeamId) {
        console.log(`⚠️ Dados incompletos para o jogo: ${match.home_team} vs ${match.away_team}`);
        console.log(`  - Competition ID: ${competitionId}`);
        console.log(`  - Home Team ID: ${homeTeamId}`);
        console.log(`  - Away Team ID: ${awayTeamId}`);
        continue;
      }

      // Verificar se o jogo já existe
      const existingMatch = await client.query(`
        SELECT id FROM matches 
        WHERE competition_id = $1 AND home_team_id = $2 AND away_team_id = $3 AND match_date = $4
      `, [competitionId, homeTeamId, awayTeamId, match.match_date]);

      if (existingMatch.rows.length === 0) {
        await client.query(`
          INSERT INTO matches (
            competition_id, home_team_id, away_team_id, match_date,
            stadium_id, round_id, status, broadcast_channels, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          competitionId,
          homeTeamId,
          awayTeamId,
          match.match_date,
          stadiumId,
          roundId,
          match.status,
          JSON.stringify(match.broadcast_channels)
        ]);
        console.log(`✅ Jogo importado: ${match.home_team} vs ${match.away_team}`);
      } else {
        console.log(`⚠️ Jogo já existe: ${match.home_team} vs ${match.away_team}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao importar jogo ${match.home_team} vs ${match.away_team}:`, error.message);
    }
  }
}

// Executar a importação
continueImport().catch(console.error); 