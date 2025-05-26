const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function importOtherCompetitions() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Importando jogos das outras competições...');
    
    // Buscar IDs das competições, times e estádios
    const competitions = await client.query('SELECT id, name FROM competitions');
    const teams = await client.query('SELECT id, name FROM teams');
    const stadiums = await client.query('SELECT id, name FROM stadiums');

    const competitionMap = {};
    competitions.rows.forEach(comp => {
      competitionMap[comp.name] = comp.id;
      // Mapeamentos adicionais
      if (comp.name === 'Copa Libertadores') {
        competitionMap['LIBERTADORES DA AMÉRICA'] = comp.id;
      }
      if (comp.name === 'Copa Sul-Americana') {
        competitionMap['COPA SUL-AMERICANA'] = comp.id;
      }
      if (comp.name === 'Brasileirão Série B') {
        competitionMap['BRASILEIRO SÉRIE B'] = comp.id;
      }
    });

    const teamMap = {};
    teams.rows.forEach(team => {
      teamMap[team.name] = team.id;
      // Mapeamentos especiais
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

    // Função para mapear estádio por nome do time
    function getStadiumForTeam(teamName) {
      const stadiumMapping = {
        'Flamengo': 'Maracanã',
        'Palmeiras': 'Allianz Parque',
        'Corinthians': 'Neo Química Arena',
        'São Paulo': 'MorumBIS',
        'Fluminense': 'Maracanã',
        'Botafogo': 'Nilton Santos',
        'Atlético-MG': 'Arena MRV',
        'Cruzeiro': 'Mineirão',
        'Internacional': 'Beira-Rio',
        'Grêmio': 'Arena do Grêmio',
        'Santos': 'Vila Belmiro',
        'Vasco da Gama': 'São Januário',
        'Fortaleza': 'Arena Castelão',
        'Ceará': 'Arena Castelão',
        'Bahia': 'Arena Fonte Nova',
        'Vitória': 'Barradão',
        'RB Bragantino': 'Nabi Abi Chedid',
        'Mirassol': 'Maião',
        'Juventude': 'Alfredo Jaconi',
        'Sport': 'Ilha do Retiro'
      };
      return stadiumMapping[teamName] || 'Maracanã';
    }

    // Dados dos jogos das outras competições
    const otherMatches = [
      // Copa Libertadores - Alguns jogos de exemplo
      {
        competition: 'Copa Libertadores',
        home_team: 'Atlético-MG',
        away_team: 'Cruzeiro',
        match_date: '2025-04-01 19:00:00',
        stadium: 'Arena MRV',
        round: 'Rodada 1',
        group_name: 'E',
        status: 'completed',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Libertadores',
        home_team: 'Flamengo',
        away_team: 'Ceará',
        match_date: '2025-04-01 21:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 1',
        group_name: 'F',
        status: 'completed',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Libertadores',
        home_team: 'Vasco da Gama',
        away_team: 'Flamengo',
        match_date: '2025-04-02 19:00:00',
        stadium: 'São Januário',
        round: 'Rodada 1',
        group_name: 'G',
        status: 'completed',
        home_score: 3,
        away_score: 3,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Libertadores',
        home_team: 'Corinthians',
        away_team: 'Vitória',
        match_date: '2025-04-02 19:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 1',
        group_name: 'C',
        status: 'completed',
        home_score: 1,
        away_score: 2,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Libertadores',
        home_team: 'Vitória',
        away_team: 'Grêmio',
        match_date: '2025-04-02 21:30:00',
        stadium: 'Barradão',
        round: 'Rodada 1',
        group_name: 'B',
        status: 'completed',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },

      // Copa Sul-Americana - Alguns jogos de exemplo
      {
        competition: 'Copa Sul-Americana',
        home_team: 'Botafogo',
        away_team: 'Internacional',
        match_date: '2025-04-01 19:00:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 1',
        group_name: 'A',
        status: 'completed',
        home_score: 2,
        away_score: 0,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Sul-Americana',
        home_team: 'Bahia',
        away_team: 'Internacional',
        match_date: '2025-04-03 19:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 1',
        group_name: 'F',
        status: 'completed',
        home_score: 1,
        away_score: 1,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Sul-Americana',
        home_team: 'Flamengo',
        away_team: 'Palmeiras',
        match_date: '2025-04-03 21:30:00',
        stadium: 'Maracanã',
        round: 'Rodada 1',
        group_name: 'C',
        status: 'completed',
        home_score: 0,
        away_score: 1,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },
      {
        competition: 'Copa Sul-Americana',
        home_team: 'São Paulo',
        away_team: 'Fortaleza',
        match_date: '2025-04-10 21:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 2',
        group_name: 'D',
        status: 'completed',
        home_score: 2,
        away_score: 2,
        broadcast_channels: { cable: ['ESPN', 'SporTV'] }
      },

      // Copa do Brasil - Alguns jogos de exemplo
      {
        competition: 'Copa do Brasil',
        home_team: 'Flamengo',
        away_team: 'Palmeiras',
        match_date: '2025-05-15 21:00:00',
        stadium: 'Maracanã',
        round: 'Oitavas de Final',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'Copa do Brasil',
        home_team: 'Corinthians',
        away_team: 'São Paulo',
        match_date: '2025-05-22 21:00:00',
        stadium: 'Neo Química Arena',
        round: 'Oitavas de Final',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'Copa do Brasil',
        home_team: 'Atlético-MG',
        away_team: 'Cruzeiro',
        match_date: '2025-05-29 21:00:00',
        stadium: 'Arena MRV',
        round: 'Oitavas de Final',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },

      // Brasileirão Série B - Alguns jogos de exemplo
      {
        competition: 'Brasileirão Série B',
        home_team: 'Sport',
        away_team: 'Ceará',
        match_date: '2025-04-04 19:00:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 1',
        status: 'completed',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV', 'Premiere'] }
      },
      {
        competition: 'Brasileirão Série B',
        home_team: 'Vitória',
        away_team: 'Bahia',
        match_date: '2025-04-05 16:00:00',
        stadium: 'Barradão',
        round: 'Rodada 1',
        status: 'completed',
        home_score: 1,
        away_score: 0,
        broadcast_channels: { cable: ['SporTV', 'Premiere'] }
      },
      {
        competition: 'Brasileirão Série B',
        home_team: 'Fortaleza',
        away_team: 'Ceará',
        match_date: '2025-04-10 19:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 2',
        status: 'completed',
        home_score: 2,
        away_score: 1,
        broadcast_channels: { cable: ['SporTV', 'Premiere'] }
      }
    ];

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`\n📋 Processando ${otherMatches.length} jogos das outras competições...`);

    for (const match of otherMatches) {
      try {
        const competitionId = competitionMap[match.competition];
        const homeTeamId = teamMap[match.home_team];
        const awayTeamId = teamMap[match.away_team];
        const stadiumId = stadiumMap[match.stadium] || stadiumMap[getStadiumForTeam(match.home_team)];

        if (!competitionId) {
          console.log(`⚠️ Competição não encontrada: ${match.competition}`);
          errorCount++;
          continue;
        }

        if (!homeTeamId || !awayTeamId) {
          console.log(`⚠️ Time não encontrado para: ${match.home_team} vs ${match.away_team}`);
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
              stadium_id, status, home_score, away_score,
              broadcast_channels, group_name, round_name, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          `, [
            competitionId,
            homeTeamId,
            awayTeamId,
            match.match_date,
            stadiumId,
            match.status,
            match.home_score || null,
            match.away_score || null,
            JSON.stringify(match.broadcast_channels),
            match.group_name || null,
            match.round || null
          ]);
          
          importedCount++;
          console.log(`✅ Importado: ${match.home_team} vs ${match.away_team} (${match.competition})`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao importar: ${match.home_team} vs ${match.away_team}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da importação das outras competições:');
    console.log(`✅ Jogos importados: ${importedCount}`);
    console.log(`⚠️ Jogos já existentes: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processado: ${otherMatches.length}`);
    
    // Verificar total final por competição
    const finalStats = await client.query(`
      SELECT 
        c.name as competition,
        COUNT(m.id) as matches_count
      FROM competitions c
      LEFT JOIN matches m ON c.id = m.competition_id
      GROUP BY c.id, c.name
      ORDER BY matches_count DESC
    `);
    
    console.log('\n🎯 Jogos por competição:');
    finalStats.rows.forEach(stat => {
      console.log(`  ${stat.competition}: ${stat.matches_count} jogos`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a importação
importOtherCompetitions().catch(console.error); 