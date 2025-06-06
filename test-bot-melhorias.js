const { Pool } = require('pg');
const axios = require('axios');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
});

// Simular análise de intenção melhorada
function analyzeMessage(message) {
  const lowerMessage = message.toLowerCase();
  console.log(`🔍 Analisando: "${message}"`);
  
  // Detectar próximo jogo
  if ((lowerMessage.includes('próximo') && lowerMessage.includes('jogo')) || 
      (lowerMessage.includes('proximo') && lowerMessage.includes('jogo'))) {
    const team = extractTeamName(lowerMessage);
    return { intent: 'next_match', team, confidence: 0.95 };
  }

  // Detectar último jogo
  if ((lowerMessage.includes('último') && lowerMessage.includes('jogo')) || 
      (lowerMessage.includes('ultimo') && lowerMessage.includes('jogo'))) {
    const team = extractTeamName(lowerMessage);
    return { intent: 'last_match', team, confidence: 0.95 };
  }

  // Detectar posição do time
  if (lowerMessage.includes('posição') || lowerMessage.includes('posicao') ||
      lowerMessage.includes('classificação') || lowerMessage.includes('classificacao')) {
    const team = extractTeamName(lowerMessage);
    return { intent: 'team_position', team, confidence: 0.90 };
  }

  // Detectar estatísticas
  if (lowerMessage.includes('estatísticas') || lowerMessage.includes('estatisticas') ||
      lowerMessage.includes('stats')) {
    const team = extractTeamName(lowerMessage);
    const competition = extractCompetitionName(lowerMessage);
    
    if (team) {
      return { intent: 'team_statistics', team, confidence: 0.90 };
    } else if (competition) {
      return { intent: 'competition_stats', competition, confidence: 0.90 };
    }
  }

  // Detectar artilheiros
  if (lowerMessage.includes('artilheiro') || lowerMessage.includes('goleador') ||
      lowerMessage.includes('artilharia')) {
    const competition = extractCompetitionName(lowerMessage);
    return { intent: 'top_scorers', competition, confidence: 0.85 };
  }

  // Detectar canais
  if (lowerMessage.includes('canais') || lowerMessage.includes('lista') ||
      lowerMessage.includes('onde assistir')) {
    return { intent: 'channels_info', confidence: 0.80 };
  }

  // Detectar transmissão
  if (lowerMessage.includes('onde passa') || lowerMessage.includes('transmissão') ||
      lowerMessage.includes('transmissao')) {
    const team = extractTeamName(lowerMessage);
    return { intent: 'broadcast_info', team, confidence: 0.90 };
  }

  // Detectar jogos da semana
  if (lowerMessage.includes('jogos') && lowerMessage.includes('semana')) {
    return { intent: 'matches_week', confidence: 0.85 };
  }
  
  // Detectar tabela
  if (lowerMessage.includes('tabela')) {
    const competition = extractCompetitionName(lowerMessage);
    return { intent: 'table', competition: competition || 'brasileirao', confidence: 0.85 };
  }
  
  // Detectar jogos de hoje
  if (lowerMessage.includes('jogos') && lowerMessage.includes('hoje')) {
    return { intent: 'matches_today', confidence: 0.80 };
  }
  
  return { intent: 'greeting', confidence: 0.50 };
}

function extractTeamName(message) {
  const teams = [
    'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 
    'botafogo', 'fluminense', 'vasco', 'atlético-mg', 'cruzeiro', 
    'internacional', 'grêmio', 'bahia', 'fortaleza', 'ceará'
  ];
  
  for (const team of teams) {
    if (message.includes(team)) {
      return team;
    }
  }
  return undefined;
}

function extractCompetitionName(message) {
  if (message.includes('libertadores')) return 'libertadores';
  if (message.includes('copa do brasil')) return 'copa-do-brasil';
  if (message.includes('brasileirão') || message.includes('brasileirao')) return 'brasileirao';
  if (message.includes('sul-americana')) return 'sul-americana';
  return undefined;
}

// Nova função para buscar estádios da API
async function fetchStadiumsFromApi() {
  try {
    const response = await axios.get('http://localhost:3000/stadiums'); // Assumindo que a API está rodando em localhost:3000
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estádios da API:', error);
    return [];
  }
}

// Buscar próximo jogo
async function findNextMatch(client, teamName) {
  try {
    const teamResult = await client.query(`
      SELECT id, name, short_name 
      FROM teams 
      WHERE LOWER(name) LIKE $1 OR LOWER(short_name) LIKE $1
      LIMIT 1
    `, [`%${teamName}%`]);
    
    if (teamResult.rows.length === 0) {
      return `❌ Time "${teamName}" não encontrado.`;
    }
    
    const team = teamResult.rows[0];
    
    const matchResult = await client.query(`
      SELECT 
        c.name as competition,
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.stadium_id,
        r.name as round_name,
        m.broadcast_channels
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.status = 'scheduled'
        AND m.match_date >= NOW()
      ORDER BY m.match_date
      LIMIT 1
    `, [team.id]);
    
    if (matchResult.rows.length === 0) {
      return `😔 Não encontrei jogos futuros para o ${team.name}.`;
    }
    
    const match = matchResult.rows[0];
    const date = new Date(match.match_date);
    const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    const isHome = match.home_team === team.name;
    const opponent = isHome ? match.away_team : match.home_team;
    const venue = isHome ? 'em casa' : 'fora de casa';
    
    let stadiumName = 'A definir';
    if (match.stadium_id) {
      const stadiums = await fetchStadiumsFromApi();
      const foundStadium = stadiums.find(s => s.id === match.stadium_id);
      if (foundStadium) {
        stadiumName = foundStadium.name;
      }
    }

    let broadcastInfo = '';
    if (match.broadcast_channels && Array.isArray(match.broadcast_channels)) {
      broadcastInfo = `\n📺 **Transmissão:** ${match.broadcast_channels.join(', ')}`;
    }
    
    return `⚽ **PRÓXIMO JOGO DO ${team.name.toUpperCase()}** ⚽

📅 **Data:** ${formattedDate}
⏰ **Horário:** ${formattedTime}
🏆 **Competição:** ${match.competition}
🆚 **Adversário:** ${opponent}
🏟️ **Estádio:** ${stadiumName}
📍 **Rodada:** ${match.round_name || 'A definir'}
🏠 **Mando:** ${venue}${broadcastInfo}

Bora torcer! 🔥⚽`;
    
  } catch (error) {
    console.error('Erro ao buscar próximo jogo:', error);
    return '❌ Erro ao buscar próximo jogo.';
  }
}

// Buscar tabela de classificação
async function getCompetitionTable(client, competitionName) {
  try {
    const competitionResult = await client.query(`
      SELECT id, name 
      FROM competitions 
      WHERE LOWER(name) LIKE $1 
      LIMIT 1
    `, [`%${competitionName}%`]);
    
    if (competitionResult.rows.length === 0) {
      return `❌ Competição "${competitionName}" não encontrada.`;
    }
    
    const competition = competitionResult.rows[0];
    
    const standingsResult = await client.query(`
      SELECT 
        t.name as team_name,
        ct.position,
        ct.points,
        ct.played,
        ct.won,
        ct.drawn,
        ct.lost,
        ct.goal_difference
      FROM competition_teams ct
      JOIN teams t ON ct.team_id = t.id
      WHERE ct.competition_id = $1
      ORDER BY ct.points DESC, ct.goal_difference DESC, ct.goals_for DESC
      LIMIT 10
    `, [competition.id]);
    
    if (standingsResult.rows.length === 0) {
      return `📊 **TABELA - ${competition.name.toUpperCase()}** 📊

😔 Ainda não há dados de classificação disponíveis.`;
    }
    
    let response = `📊 **TABELA - ${competition.name.toUpperCase()}** 📊\n\n`;
    
    standingsResult.rows.forEach((standing, index) => {
      const position = index + 1;
      const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
      
      response += `${emoji} ${standing.team_name} - ${standing.points} pts\n`;
      response += `   J:${standing.played} V:${standing.won} E:${standing.drawn} D:${standing.lost} SG:${standing.goal_difference}\n\n`;
    });
    
    return response;
    
  } catch (error) {
    console.error('Erro ao buscar tabela:', error);
    return '❌ Erro ao buscar tabela da competição.';
  }
}

// Buscar canais de transmissão
async function getChannelInfo(client) {
  try {
    const channelsResult = await client.query(`
      SELECT name, channel_number, type
      FROM channels
      WHERE active = true
      ORDER BY type, name
    `);
    
    if (channelsResult.rows.length === 0) {
      return `📺 **CANAIS DE TRANSMISSÃO** 📺

😔 Não há informações de canais disponíveis.`;
    }
    
    let response = `📺 **CANAIS DE TRANSMISSÃO** 📺\n\n`;
    
    const channelsByType = {};
    channelsResult.rows.forEach(channel => {
      if (!channelsByType[channel.type]) {
        channelsByType[channel.type] = [];
      }
      channelsByType[channel.type].push(channel);
    });
    
    const typeEmojis = {
      'tv': '📺',
      'cable': '📡',
      'streaming': '💻',
      'other': '📱'
    };
    
    const typeNames = {
      'tv': 'TV Aberta',
      'cable': 'TV por Assinatura',
      'streaming': 'Streaming',
      'other': 'Outros'
    };
    
    Object.keys(channelsByType).forEach(type => {
      const emoji = typeEmojis[type] || '📺';
      const typeName = typeNames[type] || type.toUpperCase();
      
      response += `${emoji} **${typeName}:**\n`;
      
      channelsByType[type].forEach(channel => {
        response += `• ${channel.name}`;
        if (channel.channel_number) {
          response += ` (${channel.channel_number})`;
        }
        response += `\n`;
      });
      response += `\n`;
    });
    
    return response;
    
  } catch (error) {
    console.error('Erro ao buscar canais:', error);
    return '❌ Erro ao buscar informações de canais.';
  }
}

// Buscar último jogo
async function findLastMatch(client, teamName) {
  try {
    const teamResult = await client.query(`
      SELECT id, name, short_name 
      FROM teams 
      WHERE LOWER(name) LIKE $1 OR LOWER(short_name) LIKE $1
      LIMIT 1
    `, [`%${teamName}%`]);
    
    if (teamResult.rows.length === 0) {
      return `❌ Time "${teamName}" não encontrado.`;
    }
    
    const team = teamResult.rows[0];
    
    const matchResult = await client.query(`
      SELECT 
        c.name as competition,
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.home_team_goals,
        m.away_team_goals,
        m.stadium_id,
        r.name as round_name
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.status = 'finished'
        AND m.match_date < NOW()
      ORDER BY m.match_date DESC
      LIMIT 1
    `, [team.id]);
    
    if (matchResult.rows.length === 0) {
      return `😔 Não encontrei jogos anteriores para o ${team.name}.`;
    }
    
    const match = matchResult.rows[0];
    const date = new Date(match.match_date);
    const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    const isHome = match.home_team === team.name;
    const opponent = isHome ? match.away_team : match.home_team;
    const teamGoals = isHome ? match.home_team_goals : match.away_team_goals;
    const opponentGoals = isHome ? match.away_team_goals : match.home_team_goals;

    let stadiumName = 'A definir';
    if (match.stadium_id) {
      const stadiums = await fetchStadiumsFromApi();
      const foundStadium = stadiums.find(s => s.id === match.stadium_id);
      if (foundStadium) {
        stadiumName = foundStadium.name;
      }
    }
    
    return `⚽ **ÚLTIMO JOGO DO ${team.name.toUpperCase()}** ⚽

📅 **Data:** ${formattedDate}
⏰ **Horário:** ${formattedTime}
🏆 **Competição:** ${match.competition}
🆚 **Placar:** ${team.name} ${teamGoals} x ${opponentGoals} ${opponent}
🏟️ **Estádio:** ${stadiumName}
📍 **Rodada:** ${match.round_name || 'A definir'}

Relembrando o jogo! ⚽`;
    
  } catch (error) {
    console.error('Erro ao buscar último jogo:', error);
    return '❌ Erro ao buscar último jogo.';
  }
}

// Buscar posição do time
async function getTeamPosition(client, teamName) {
  try {
    const teamResult = await client.query(`
      SELECT id, name, short_name 
      FROM teams 
      WHERE LOWER(name) LIKE $1 OR LOWER(short_name) LIKE $1
      LIMIT 1
    `, [`%${teamName}%`]);
    
    if (teamResult.rows.length === 0) {
      return `❌ Time "${teamName}" não encontrado.`;
    }
    
    const team = teamResult.rows[0];

    const positionResult = await client.query(`
      SELECT 
        ct.position,
        ct.points,
        c.name as competition_name
      FROM competition_teams ct
      JOIN competitions c ON ct.competition_id = c.id
      WHERE ct.team_id = $1
      ORDER BY ct.position ASC
      LIMIT 1
    `, [team.id]);

    if (positionResult.rows.length === 0) {
      return `😔 Não encontrei a posição do ${team.name} em nenhuma competição.`;
    }

    const positionData = positionResult.rows[0];

    return `📊 **POSIÇÃO DO ${team.name.toUpperCase()}** 📊

Em ${positionData.competition_name}, o ${team.name} está na **${positionData.position}ª posição** com **${positionData.points} pontos**.`;

  } catch (error) {
    console.error('Erro ao buscar posição do time:', error);
    return '❌ Erro ao buscar posição do time.';
  }
}

// Buscar artilheiros
async function getTopScorers(client, competitionName) {
  try {
    const competitionResult = await client.query(`
      SELECT id, name 
      FROM competitions 
      WHERE LOWER(name) LIKE $1 
      LIMIT 1
    `, [`%${competitionName}%`]);
    
    if (competitionResult.rows.length === 0) {
      return `❌ Competição "${competitionName}" não encontrada.`;
    }
    
    const competition = competitionResult.rows[0];

    const scorersResult = await client.query(`
      SELECT 
        p.name as player_name,
        t.name as team_name,
        gs.goals
      FROM goal_scorers gs
      JOIN players p ON gs.player_id = p.id
      JOIN teams t ON p.current_team_id = t.id
      WHERE gs.competition_id = $1
      ORDER BY gs.goals DESC
      LIMIT 5
    `, [competition.id]);

    if (scorersResult.rows.length === 0) {
      return `⚽️ **ARTILHARIA - ${competition.name.toUpperCase()}** ⚽️

😔 Ainda não há dados de artilharia disponíveis.`;
    }

    let response = `⚽️ **ARTILHARIA - ${competition.name.toUpperCase()}** ⚽️

`;
    scorersResult.rows.forEach((scorer, index) => {
      response += `${index + 1}º - ${scorer.player_name} (${scorer.team_name}) - ${scorer.goals} gols
`;
    });

    return response;

  } catch (error) {
    console.error('Erro ao buscar artilheiros:', error);
    return '❌ Erro ao buscar artilheiros.';
  }
}

// Processar mensagem
async function processMessage(message) {
  const intent = analyzeMessage(message);
  console.log(`✨ Intenção detectada: ${intent.intent} (Confiança: ${intent.confidence})`);

  const client = await pool.connect();
  try {
    switch (intent.intent) {
      case 'next_match':
        return await findNextMatch(client, intent.team);
      case 'last_match':
        return await findLastMatch(client, intent.team);
      case 'team_position':
        return await getTeamPosition(client, intent.team);
      case 'team_statistics':
        // Lógica para estatísticas do time (ainda não implementada)
        return `📊 As estatísticas do time ${intent.team} ainda estão sendo compiladas! Em breve teremos novidades.`;
      case 'competition_stats':
        // Lógica para estatísticas da competição (ainda não implementada)
        return `📊 As estatísticas da competição ${intent.competition} ainda estão sendo compiladas! Em breve teremos novidades.`;
      case 'top_scorers':
        return await getTopScorers(client, intent.competition);
      case 'channels_info':
        return await getChannelInfo(client);
      case 'broadcast_info':
        // Lógica para informações de transmissão (ainda não implementada)
        return `📺 A informação de transmissão para o jogo do ${intent.team} está sendo verificada.`;
      case 'matches_week':
        // Lógica para jogos da semana (ainda não implementada)
        return '📅 Os jogos da semana estão sendo atualizados! Fique ligado para não perder nenhum lance.';
      case 'table':
        return await getCompetitionTable(client, intent.competition);
      case 'matches_today':
        // Lógica para jogos de hoje (ainda não implementada)
        return '📅 Os jogos de hoje estão sendo carregados! Aguarde para ver as partidas do dia.';
      case 'greeting':
        return '👋 Olá! Como posso ajudar você hoje?';
      default:
        return 'Desculpe, não entendi a sua pergunta. Poderia reformular?';
    }
  } finally {
    client.release();
  }
}

// Função para testar as funcionalidades do bot
async function runTests() {
  console.log('\n--- Testando próximo jogo do Flamengo ---');
  console.log(await processMessage('Qual o próximo jogo do Flamengo?'));

  console.log('\n--- Testando último jogo do Palmeiras ---');
  console.log(await processMessage('Resultado do último jogo do Palmeiras?'));

  console.log('\n--- Testando posição do Corinthians ---');
  console.log(await processMessage('Qual a posição do Corinthians na tabela?'));

  console.log('\n--- Testando artilharia do Brasileirão ---');
  console.log(await processMessage('Quem são os artilheiros do Brasileirão?'));

  console.log('\n--- Testando canais de transmissão ---');
  console.log(await processMessage('Onde posso assistir os jogos?'));

  console.log('\n--- Testando tabela do Brasileirão ---');
  console.log(await processMessage('Tabela do brasileirão'));
  
  console.log('\n--- Testando jogos de hoje ---');
  console.log(await processMessage('Jogos de hoje'));

  console.log('\n--- Testando mensagem desconhecida ---');
  console.log(await processMessage('Qual a previsão do tempo?'));
}

// Executar os testes
// runTests();

module.exports = {
  processMessage
}; 