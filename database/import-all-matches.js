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

async function importAllMatches() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Importando todos os jogos da base antiga...');
    
    // Buscar IDs das competições, times e estádios
    const competitions = await client.query('SELECT id, name FROM competitions');
    const teams = await client.query('SELECT id, name FROM teams');
    const stadiums = await client.query('SELECT id, name FROM stadiums');
    const rounds = await client.query('SELECT id, name, competition_id FROM rounds');

    const competitionMap = {};
    competitions.rows.forEach(comp => {
      competitionMap[comp.name] = comp.id;
      // Mapeamentos alternativos
      if (comp.name === 'Brasileirão Série A') {
        competitionMap['BRASILEIRÃO'] = comp.id;
        competitionMap['BRASILEIRÃO '] = comp.id;
      }
      if (comp.name === 'Copa Libertadores') {
        competitionMap['LIBERTADORES DA AMÉRICA'] = comp.id;
      }
      if (comp.name === 'Copa Sul-Americana') {
        competitionMap['COPA SUL-AMERICANA'] = comp.id;
      }
    });

    const teamMap = {};
    teams.rows.forEach(team => {
      teamMap[team.name] = team.id;
      // Mapeamentos alternativos para nomes diferentes
      if (team.name === 'Vasco da Gama') {
        teamMap['Vasco'] = team.id;
        teamMap['Vasco '] = team.id;
      }
      if (team.name === 'RB Bragantino') {
        teamMap['Bragantino'] = team.id;
      }
    });

    const stadiumMap = {};
    stadiums.rows.forEach(stadium => {
      stadiumMap[stadium.name] = stadium.id;
    });

    const roundMap = {};
    rounds.rows.forEach(round => {
      roundMap[`${round.competition_id}-${round.name}`] = round.id;
    });

    // Dados dos jogos do Brasileirão (baseados no arquivo SQL original)
    const allMatches = [
      // Rodada 1
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Internacional',
        match_date: '2025-03-29 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'], streaming: ['Globoplay'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Santos',
        match_date: '2025-03-29 18:30:00',
        stadium: 'São Januário',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'], streaming: ['CazéTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Botafogo',
        match_date: '2025-03-30 16:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Sport',
        match_date: '2025-03-29 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Ceará',
        match_date: '2025-03-31 20:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'], streaming: ['Amazon Prime Video'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Mirassol',
        match_date: '2025-03-29 18:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Atlético-MG',
        match_date: '2025-03-29 18:30:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'], streaming: ['CazéTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Corinthians',
        match_date: '2025-03-30 18:30:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Fluminense',
        match_date: '2025-03-29 18:30:00',
        stadium: 'Castelão',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Vitória',
        match_date: '2025-03-29 18:30:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 1',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 2
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Vasco ',
        match_date: '2025-04-05 18:30:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 3,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Cruzeiro',
        match_date: '2025-04-06 16:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 3,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Flamengo',
        match_date: '2025-04-06 16:00:00',
        stadium: 'Barradão',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 1,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Grêmio',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Castelão',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'São Paulo',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Fortaleza',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Campos Maia',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Bahia',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Palmeiras',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 1,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'RB Bragantino',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Juventude',
        match_date: '2025-04-06 18:30:00',
        stadium: 'Estádio Nilton Santos',
        round: 'Rodada 2',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 3
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Botafogo',
        match_date: '2025-04-12 16:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Ceará',
        match_date: '2025-04-12 16:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Corinthians',
        match_date: '2025-04-12 18:30:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV', 'Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Sport',
        match_date: '2025-04-12 21:00:00',
        stadium: 'São Januário',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 3,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Mirassol',
        match_date: '2025-04-13 16:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Flamengo',
        match_date: '2025-04-13 17:30:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 0,
        away_score: 2,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Cruzeiro',
        match_date: '2025-04-13 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'Santos',
        match_date: '2025-04-13 19:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Internacional',
        match_date: '2025-04-13 20:00:00',
        stadium: 'Castelão',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Vitória',
        match_date: '2025-04-13 20:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 3',
        status: 'finished',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 4
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Vasco ',
        match_date: '2025-04-15 21:30:00',
        stadium: 'Castelão',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Grêmio',
        match_date: '2025-04-16 19:00:00',
        stadium: 'Campos Maia',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 4,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'RB Bragantino',
        match_date: '2025-04-16 19:00:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Fluminense',
        match_date: '2025-04-16 19:30:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 0,
        away_score: 2,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Palmeiras',
        match_date: '2025-04-16 19:30:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Juventude',
        match_date: '2025-04-16 21:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 6,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Atlético-MG',
        match_date: '2025-04-16 21:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Fortaleza',
        match_date: '2025-04-16 21:30:00',
        stadium: 'Barradão',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'São Paulo',
        match_date: '2025-04-16 18:30:00',
        stadium: 'Estádio Nilton Santos',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Bahia',
        match_date: '2025-04-17 21:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 4',
        status: 'finished',
        home_score: 3,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      }
    ];

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const match of allMatches) {
      try {
        const competitionId = competitionMap[match.competition];
        const homeTeamId = teamMap[match.home_team];
        const awayTeamId = teamMap[match.away_team];
        const stadiumId = stadiumMap[match.stadium];
        const roundId = roundMap[`${competitionId}-${match.round}`];

        if (!competitionId || !homeTeamId || !awayTeamId) {
          console.log(`⚠️ Dados incompletos para o jogo: ${match.home_team} vs ${match.away_team}`);
          console.log(`  - Competition: ${match.competition} (ID: ${competitionId})`);
          console.log(`  - Home Team: ${match.home_team} (ID: ${homeTeamId})`);
          console.log(`  - Away Team: ${match.away_team} (ID: ${awayTeamId})`);
          errorCount++;
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
              stadium_id, round_id, status, home_score, away_score,
              broadcast_channels, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          `, [
            competitionId,
            homeTeamId,
            awayTeamId,
            match.match_date,
            stadiumId,
            roundId,
            match.status,
            match.home_score || null,
            match.away_score || null,
            JSON.stringify(match.broadcast_channels)
          ]);
          console.log(`✅ Jogo importado: ${match.home_team} ${match.home_score || 0} x ${match.away_score || 0} ${match.away_team} (${match.round})`);
          importedCount++;
        } else {
          console.log(`⚠️ Jogo já existe: ${match.home_team} vs ${match.away_team} (${match.round})`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao importar jogo ${match.home_team} vs ${match.away_team}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da importação:');
    console.log(`✅ Jogos importados: ${importedCount}`);
    console.log(`⚠️ Jogos já existentes: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processado: ${allMatches.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a importação
importAllMatches().catch(console.error); 