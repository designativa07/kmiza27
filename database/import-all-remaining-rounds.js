const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function importAllRemainingRounds() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Importando todas as rodadas restantes do Brasileirão (10-38)...');
    
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

    // Dados completos das rodadas 10-38
    const allMatches = [
      // Rodada 10
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Corinthians',
        match_date: '2025-05-24 21:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'Cruzeiro',
        match_date: '2025-05-25 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Ceará',
        match_date: '2025-05-25 16:00:00',
        stadium: 'Arena MRV',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'RB Bragantino',
        match_date: '2025-05-25 18:30:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Juventude',
        match_date: '2025-05-25 18:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Vasco ',
        match_date: '2025-05-25 20:30:00',
        stadium: 'Maião',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Bahia',
        match_date: '2025-05-26 20:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'São Paulo',
        match_date: '2025-05-26 20:00:00',
        stadium: 'Barradão',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Flamengo',
        match_date: '2025-05-25 21:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Sport',
        match_date: '2025-05-26 20:00:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 10',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },

      // Rodada 11
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Palmeiras',
        match_date: '2025-05-31 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Fluminense',
        match_date: '2025-06-01 16:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Botafogo',
        match_date: '2025-06-01 18:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Internacional',
        match_date: '2025-06-01 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Grêmio',
        match_date: '2025-06-01 20:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Santos',
        match_date: '2025-06-02 20:00:00',
        stadium: 'São Januário',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Atlético-MG',
        match_date: '2025-06-02 20:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Vitória',
        match_date: '2025-06-02 20:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Mirassol',
        match_date: '2025-06-01 16:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Fortaleza',
        match_date: '2025-06-01 20:30:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 11',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 12
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Cruzeiro',
        match_date: '2025-06-07 21:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'RB Bragantino',
        match_date: '2025-06-08 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Vasco ',
        match_date: '2025-06-08 18:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Ceará',
        match_date: '2025-06-08 18:30:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Bahia',
        match_date: '2025-06-08 20:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Sport',
        match_date: '2025-06-09 20:00:00',
        stadium: 'Maião',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Corinthians',
        match_date: '2025-06-09 20:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Flamengo',
        match_date: '2025-06-09 20:00:00',
        stadium: 'Barradão',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Juventude',
        match_date: '2025-06-08 16:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'São Paulo',
        match_date: '2025-06-08 21:00:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 12',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },

      // Rodada 13
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Santos',
        match_date: '2025-06-14 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Atlético-MG',
        match_date: '2025-06-15 16:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Mirassol',
        match_date: '2025-06-15 18:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Botafogo',
        match_date: '2025-06-15 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Internacional',
        match_date: '2025-06-15 20:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Fluminense',
        match_date: '2025-06-16 20:00:00',
        stadium: 'São Januário',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Vitória',
        match_date: '2025-06-16 20:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Grêmio',
        match_date: '2025-06-16 20:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Palmeiras',
        match_date: '2025-06-15 16:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Fortaleza',
        match_date: '2025-06-15 20:30:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 13',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 14
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'RB Bragantino',
        match_date: '2025-06-21 21:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'Ceará',
        match_date: '2025-06-22 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Sport',
        match_date: '2025-06-22 18:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Juventude',
        match_date: '2025-06-22 18:30:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Corinthians',
        match_date: '2025-06-22 20:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Bahia',
        match_date: '2025-06-23 20:00:00',
        stadium: 'Maião',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Vasco ',
        match_date: '2025-06-23 20:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Cruzeiro',
        match_date: '2025-06-23 20:00:00',
        stadium: 'Barradão',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'São Paulo',
        match_date: '2025-06-22 16:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Flamengo',
        match_date: '2025-06-22 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 14',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },

      // Rodada 15
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Atlético-MG',
        match_date: '2025-06-28 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Vitória',
        match_date: '2025-06-29 16:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Santos',
        match_date: '2025-06-29 18:30:00',
        stadium: 'Mineirão',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Mirassol',
        match_date: '2025-06-29 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Palmeiras',
        match_date: '2025-06-29 20:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Botafogo',
        match_date: '2025-06-30 20:00:00',
        stadium: 'São Januário',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Internacional',
        match_date: '2025-06-30 20:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Fortaleza',
        match_date: '2025-06-30 20:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Fluminense',
        match_date: '2025-06-29 16:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Grêmio',
        match_date: '2025-06-29 20:30:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 15',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },

      // Rodada 16
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Juventude',
        match_date: '2025-07-05 21:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'São Paulo',
        match_date: '2025-07-06 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'Grêmio',
        match_date: '2025-07-06 18:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Sport',
        match_date: '2025-07-06 18:30:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Vasco ',
        match_date: '2025-07-06 20:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Ceará',
        match_date: '2025-07-07 20:00:00',
        stadium: 'Maião',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'RB Bragantino',
        match_date: '2025-07-07 20:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'Bahia',
        match_date: '2025-07-07 20:00:00',
        stadium: 'Barradão',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Corinthians',
        match_date: '2025-07-06 16:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Cruzeiro',
        match_date: '2025-07-06 21:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 16',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },

      // Rodada 17
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Bahia',
        match_date: '2025-07-12 21:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Fortaleza',
        match_date: '2025-07-13 16:00:00',
        stadium: 'Mineirão',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Palmeiras',
        match_date: '2025-07-13 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Flamengo',
        match_date: '2025-07-13 18:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Atlético-MG',
        match_date: '2025-07-13 20:30:00',
        stadium: 'São Januário',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Santos',
        match_date: '2025-07-14 20:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Botafogo',
        match_date: '2025-07-14 20:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Vitória',
        match_date: '2025-07-14 20:00:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Internacional',
        match_date: '2025-07-13 16:00:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Fluminense',
        match_date: '2025-07-13 21:00:00',
        stadium: 'Maião',
        round: 'Rodada 17',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },

      // Rodada 18
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Palmeiras',
        away_team: 'Mirassol',
        match_date: '2025-07-19 21:00:00',
        stadium: 'Allianz Parque',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fluminense',
        away_team: 'Grêmio',
        match_date: '2025-07-20 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Atlético-MG',
        away_team: 'São Paulo',
        match_date: '2025-07-20 18:30:00',
        stadium: 'Arena MRV',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Botafogo',
        away_team: 'Corinthians',
        match_date: '2025-07-20 18:30:00',
        stadium: 'Nilton Santos',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Santos',
        away_team: 'Sport',
        match_date: '2025-07-20 20:30:00',
        stadium: 'Vila Belmiro',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Fortaleza',
        away_team: 'Ceará',
        match_date: '2025-07-21 20:00:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vitória',
        away_team: 'RB Bragantino',
        match_date: '2025-07-21 20:00:00',
        stadium: 'Barradão',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Internacional',
        away_team: 'Vasco ',
        match_date: '2025-07-21 20:00:00',
        stadium: 'Beira-Rio',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Flamengo',
        away_team: 'Juventude',
        match_date: '2025-07-20 16:00:00',
        stadium: 'Maracanã',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Bahia',
        away_team: 'Cruzeiro',
        match_date: '2025-07-20 21:00:00',
        stadium: 'Arena Fonte Nova',
        round: 'Rodada 18',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },

      // Rodada 19
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Corinthians',
        away_team: 'Palmeiras',
        match_date: '2025-07-26 21:00:00',
        stadium: 'Neo Química Arena',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Cruzeiro',
        away_team: 'Internacional',
        match_date: '2025-07-27 16:00:00',
        stadium: 'Mineirão',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'São Paulo',
        away_team: 'Bahia',
        match_date: '2025-07-27 18:30:00',
        stadium: 'MorumBIS',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Ceará',
        away_team: 'Fluminense',
        match_date: '2025-07-27 18:30:00',
        stadium: 'Arena Castelão',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Vasco ',
        away_team: 'Vitória',
        match_date: '2025-07-27 20:30:00',
        stadium: 'São Januário',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'RB Bragantino',
        away_team: 'Fortaleza',
        match_date: '2025-07-28 20:00:00',
        stadium: 'Nabi Abi Chedid',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Juventude',
        away_team: 'Santos',
        match_date: '2025-07-28 20:00:00',
        stadium: 'Alfredo Jaconi',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['Premiere'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Grêmio',
        away_team: 'Botafogo',
        match_date: '2025-07-28 20:00:00',
        stadium: 'Arena do Grêmio',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Sport',
        away_team: 'Flamengo',
        match_date: '2025-07-27 16:00:00',
        stadium: 'Ilha do Retiro',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { cable: ['SporTV'] }
      },
      {
        competition: 'BRASILEIRÃO ',
        home_team: 'Mirassol',
        away_team: 'Atlético-MG',
        match_date: '2025-07-27 21:00:00',
        stadium: 'Maião',
        round: 'Rodada 19',
        status: 'scheduled',
        broadcast_channels: { tv: ['Globo'], cable: ['SporTV'] }
      }
    ];

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`\n📋 Processando ${allMatches.length} jogos...`);

    for (const match of allMatches) {
      try {
        const competitionId = competitionMap[match.competition];
        const homeTeamId = teamMap[match.home_team];
        const awayTeamId = teamMap[match.away_team];
        const stadiumId = stadiumMap[match.stadium];
        const roundId = roundMap[`${competitionId}-${match.round}`];

        if (!competitionId || !homeTeamId || !awayTeamId) {
          console.log(`⚠️ Dados incompletos para: ${match.home_team} vs ${match.away_team} (${match.round})`);
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
          
          importedCount++;
          if (importedCount % 10 === 0) {
            console.log(`✅ ${importedCount} jogos importados...`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao importar: ${match.home_team} vs ${match.away_team}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da importação completa:');
    console.log(`✅ Jogos importados: ${importedCount}`);
    console.log(`⚠️ Jogos já existentes: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processado: ${allMatches.length}`);
    
    // Verificar total final
    const finalCount = await client.query('SELECT COUNT(*) FROM matches');
    console.log(`\n🎯 Total de jogos no banco: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a importação
importAllRemainingRounds().catch(console.error); 