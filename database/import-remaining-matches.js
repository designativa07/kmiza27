const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function importRemainingMatches() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Importando rodadas restantes do Brasileirão (5-9)...');
    
    // Buscar IDs das competições, times e estádios
    const competitions = await client.query('SELECT id, name FROM competitions');
    const teams = await client.query('SELECT id, name FROM teams');
    const stadiums = await client.query('SELECT id, name FROM stadiums');
    const rounds = await client.query('SELECT id, name, competition_id FROM rounds');

    const competitionMap = {};
    competitions.rows.forEach(comp => {
      competitionMap[comp.name] = comp.id;
      if (comp.name === 'Brasileirão Série A') {
        competitionMap['BRASILEIRÃO'] = comp.id;
        competitionMap['BRASILEIRÃO '] = comp.id;
      }
    });

    const teamMap = {};
    teams.rows.forEach(team => {
      teamMap[team.name] = team.id;
      // Mapeamentos alternativos
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

    // Dados das rodadas 5-9 do Brasileirão (baseados no arquivo SQL original)
    const remainingMatches = [
      // Rodada 5
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Sport',
        match_date: '2025-04-19 16:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'], streaming: ['Amazon Prime Video'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Flamengo',
        match_date: '2025-04-19 18:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Internacional',
        match_date: '2025-04-19 21:00:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'], streaming: ['CazéTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Mirassol',
        match_date: '2025-04-20 11:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Botafogo',
        match_date: '2025-04-20 16:00:00',
        stadium: 'Arena MRV',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Santos',
        match_date: '2025-04-20 16:00:00',
        stadium: 'MorumBIS',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'Vitória',
        match_date: '2025-04-20 18:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Palmeiras',
        match_date: '2025-04-20 18:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 1,
        away_score: 2,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Cruzeiro',
        match_date: '2025-04-20 20:30:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Ceará',
        match_date: '2025-04-21 20:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 5',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },

      // Rodada 6
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Corinthians',
        match_date: '2025-04-27 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 4,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Fluminense',
        match_date: '2025-04-26 21:00:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Bahia',
        match_date: '2025-04-27 18:30:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'RB Bragantino',
        match_date: '2025-04-27 20:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 1,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Atlético-MG',
        match_date: '2025-04-26 18:30:00',
        stadium: 'Maião',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Vasco ',
        match_date: '2025-04-27 18:30:00',
        stadium: 'Parque do Sabiá',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Juventude',
        match_date: '2025-04-26 16:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 3,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Grêmio',
        match_date: '2025-04-27 18:30:00',
        stadium: 'Barradão',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'São Paulo',
        match_date: '2025-04-26 18:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Fortaleza',
        match_date: '2025-04-26 20:00:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 6',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 7
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'Sport',
        match_date: '2025-05-03 18:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Palmeiras',
        match_date: '2025-05-04 16:00:00',
        stadium: 'Mané Garrincha',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Internacional',
        match_date: '2025-05-03 18:30:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 4,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Fortaleza',
        match_date: '2025-05-02 21:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Mirassol',
        match_date: '2025-05-05 19:00:00',
        stadium: 'Cícero de Souza Marques',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Flamengo',
        match_date: '2025-05-04 18:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Santos',
        match_date: '2025-05-04 16:00:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Botafogo',
        match_date: '2025-05-03 21:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Vitória',
        match_date: '2025-05-03 18:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Atlético-MG',
        match_date: '2025-05-05 20:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 7',
        status: 'finished',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },

      // Rodada 8
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Bahia',
        match_date: '2025-05-10 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Internacional',
        match_date: '2025-05-11 20:00:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 4,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'São Paulo',
        match_date: '2025-05-11 17:30:00',
        stadium: 'Arena Barueri',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Ceará',
        match_date: '2025-05-12 20:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Corinthians',
        match_date: '2025-05-10 18:30:00',
        stadium: 'Maião',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Fluminense',
        match_date: '2025-05-11 17:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 3,
        away_score: 2,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'RB Bragantino',
        match_date: '2025-05-10 18:30:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Vasco ',
        match_date: '2025-05-10 18:30:00',
        stadium: 'Barradão',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Juventude',
        match_date: '2025-05-10 16:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 5,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Cruzeiro',
        match_date: '2025-05-11 16:00:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 8',
        status: 'finished',
        home_score: 0,
        away_score: 4,
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 9
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Sport',
        match_date: '2025-05-17 16:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Fortaleza',
        match_date: '2025-05-17 18:30:00',
        stadium: 'São Januário',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 3,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Grêmio',
        match_date: '2025-05-17 21:00:00',
        stadium: 'MorumBIS',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Santos',
        match_date: '2025-05-18 16:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Vitória',
        match_date: '2025-05-18 16:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Fluminense',
        match_date: '2025-05-18 16:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Botafogo',
        match_date: '2025-05-18 18:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Palmeiras',
        match_date: '2025-05-18 18:30:00',
        stadium: 'Cícero de Souza Marques',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 1,
        away_score: 2,
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Atlético-MG',
        match_date: '2025-05-18 20:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 0,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Mirassol',
        match_date: '2025-05-18 20:30:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 9',
        status: 'finished',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV'] }
      }
    ];

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const match of remainingMatches) {
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

    console.log('\n📊 Resumo da importação das rodadas 5-9:');
    console.log(`✅ Jogos importados: ${importedCount}`);
    console.log(`⚠️ Jogos já existentes: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processado: ${remainingMatches.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a importação
importRemainingMatches().catch(console.error); 