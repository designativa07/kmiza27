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

  // Detectar canais - MELHORADO
  if (lowerMessage.includes('canais') || lowerMessage.includes('lista') ||
      lowerMessage.includes('onde assistir') || lowerMessage.includes('assistir') ||
      lowerMessage.includes('transmissão') || lowerMessage.includes('transmissao')) {
    return { intent: 'channels_info', confidence: 0.90 };
  }

  // Detectar transmissão específica
  if (lowerMessage.includes('onde passa')) {
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
    console.log('🔍 Buscando estádios da API...');
    const response = await axios.get('http://localhost:3000/stadiums');
    console.log('✅ Dados da API de estádios recebidos:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar estádios da API:', error.message);
    // Fallback: buscar diretamente do banco se a API falhar
    console.log('🔄 Tentando buscar estádios diretamente do banco...');
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT id, name FROM stadiums ORDER BY name');
      client.release();
      console.log('✅ Estádios do banco:', JSON.stringify(result.rows, null, 2));
      return result.rows;
    } catch (dbError) {
      console.error('❌ Erro ao buscar estádios do banco:', dbError.message);
      return [];
    }
  }
}

// Função para buscar estádio por ID
async function getStadiumById(stadiumId) {
  if (!stadiumId) {
    console.log('⚠️ ID do estádio não fornecido');
    return null;
  }
  
  console.log(`🔍 Buscando estádio com ID: ${stadiumId}`);
  const stadiums = await fetchStadiumsFromApi();
  
  // Tentar encontrar por ID exato
  let foundStadium = stadiums.find(s => s.id === stadiumId);
  
  // Se não encontrar, tentar conversão de tipos
  if (!foundStadium) {
    foundStadium = stadiums.find(s => parseInt(s.id) === parseInt(stadiumId));
  }
  
  if (foundStadium) {
    console.log(`✅ Estádio encontrado: ${foundStadium.name}`);
    return foundStadium;
  } else {
    console.log(`❌ Estádio com ID ${stadiumId} não encontrado`);
    console.log('📋 IDs disponíveis:', stadiums.map(s => `${s.id}: ${s.name}`));
    return null;
  }
}

// Buscar próximo jogo
async function findNextMatch(client, teamName) {
  try {
    console.log(`🔍 Buscando próximo jogo para: ${teamName}`);
    
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
    console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`);
    
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
    console.log(`✅ Próximo jogo encontrado:`, JSON.stringify(match, null, 2));
    
    const date = new Date(match.match_date);
    const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    let stadiumName = 'A definir';
    if (match.stadium_id) {
      const foundStadium = await getStadiumById(match.stadium_id);
      if (foundStadium) {
        stadiumName = foundStadium.name;
      }
    }

    let broadcastInfo = '';
    if (match.broadcast_channels && Array.isArray(match.broadcast_channels) && match.broadcast_channels.length > 0) {
      broadcastInfo = match.broadcast_channels.join(', ');
    } else {
      broadcastInfo = 'A definir';
    }
    
    return `⚽ PRÓXIMO JOGO DO ${team.name.toUpperCase()} ⚽\n${match.home_team} x ${match.away_team}\n📅 Data: ${formattedDate}\n⏰ Hora: ${formattedTime}\n\n🏆 Competição: ${match.competition}\n📍 Rodada: ${match.round_name || 'A definir'}\n🏟️ Estádio: ${stadiumName}\n\n📺 Transmissão: ${broadcastInfo}\n\nBora torcer! 🔥⚽`;
    
  } catch (error) {
    console.error('❌ Erro ao buscar próximo jogo:', error);
    return '❌ Erro ao buscar próximo jogo.';
  }
}

// Buscar tabela de classificação
async function getCompetitionTable(client, competitionName) {
  try {
    console.log(`🔍 Buscando tabela para competição: ${competitionName}`);
    
    // Melhorar a busca de competições
    let searchTerm = competitionName;
    if (competitionName === 'brasileirao') {
      searchTerm = 'brasileirão';
    }
    
    const competitionResult = await client.query(`
      SELECT id, name 
      FROM competitions 
      WHERE LOWER(name) LIKE $1 OR LOWER(name) LIKE $2
      LIMIT 1
    `, [`%${searchTerm}%`, `%${competitionName}%`]);
    
    console.log(`🔍 Resultado da busca de competição:`, competitionResult.rows);
    
    if (competitionResult.rows.length === 0) {
      // Listar competições disponíveis para debug
      const allCompetitions = await client.query('SELECT name FROM competitions ORDER BY name');
      console.log('📋 Competições disponíveis:', allCompetitions.rows.map(c => c.name));
      return `❌ Competição "${competitionName}" não encontrada.\n\n📋 Competições disponíveis: ${allCompetitions.rows.map(c => c.name).join(', ')}`;
    }
    
    const competition = competitionResult.rows[0];
    console.log(`✅ Competição encontrada: ${competition.name} (ID: ${competition.id})`);
    
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
      ORDER BY ct.position ASC, ct.points DESC, ct.goal_difference DESC
      LIMIT 10
    `, [competition.id]);
    
    console.log(`📊 Dados da tabela encontrados: ${standingsResult.rows.length} times`);
    
    if (standingsResult.rows.length === 0) {
      return `📊 TABELA - ${competition.name.toUpperCase()} 📊\n\n😔 Ainda não há dados de classificação disponíveis.`;
    }
    
    let response = `📊 TABELA - ${competition.name.toUpperCase()} 📊\n\n`;
    
    standingsResult.rows.forEach((standing, index) => {
      const position = standing.position || (index + 1);
      const points = standing.points || 0;
      const played = standing.played || 0;
      const won = standing.won || 0;
      const drawn = standing.drawn || 0;
      const lost = standing.lost || 0;
      const goalDiff = standing.goal_difference || 0;
      
      const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
      
      response += `${emoji} ${standing.team_name} - ${points} pts\n`;
      response += `   J:${played} V:${won} E:${drawn} D:${lost} SG:${goalDiff}\n\n`;
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Erro ao buscar tabela:', error);
    return '❌ Erro ao buscar tabela da competição.';
  }
}

// Buscar canais de transmissão
async function getChannelInfo(client) {
  try {
    console.log('🔍 Buscando informações de canais...');
    
    // Primeiro, verificar quais colunas existem na tabela channels
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'channels'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas disponíveis na tabela channels:', columnsResult.rows.map(r => r.column_name));
    
    // Buscar usando as colunas que existem
    const channelsResult = await client.query(`
      SELECT name, channel_link, type, channel_number
      FROM channels
      WHERE active = true
      ORDER BY name ASC
    `);

    console.log(`📺 Canais encontrados: ${channelsResult.rows.length}`);

    if (channelsResult.rows.length === 0) {
      return '😔 Não encontrei informações sobre canais de transmissão.';
    }

    let response = `📺 CANAIS DE TRANSMISSÃO 📺\n\n`;
    channelsResult.rows.forEach(channel => {
      response += `* *${channel.name}*`;
      
      if (channel.type) {
        response += ` (${channel.type})`;
      }
      
      if (channel.channel_number) {
        response += ` - Canal ${channel.channel_number}`;
      }
      
      response += `\n`;
      
      if (channel.channel_link) {
        response += `  🔗 ${channel.channel_link}\n`;
      }
      response += `\n`;
    });
    
    return response;

  } catch (error) {
    console.error('❌ Erro ao buscar informações de canais:', error.message);
    
    // Fallback: retornar informação genérica
    return `📺 CANAIS DE TRANSMISSÃO 📺\n\n🔧 Status: Sistema de canais ainda está sendo configurado.\n\n📋 Canais populares:\n* *Globo* - TV aberta\n* *SporTV* - TV por assinatura\n* *Premiere* - Pay-per-view\n* *Amazon Prime Video* - Streaming\n* *Paramount+* - Streaming\n\n💡 Dica: Verifique a programação de cada canal para confirmar as transmissões.`;
  }
}

// Buscar último jogo
async function findLastMatch(client, teamName) {
  try {
    console.log(`🔍 Buscando último jogo para: ${teamName}`);
    
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
    console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`);
    
    const matchResult = await client.query(`
      SELECT 
        c.name as competition,
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
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
    console.log(`✅ Último jogo encontrado:`, JSON.stringify(match, null, 2));
    
    const date = new Date(match.match_date);
    const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });

    let stadiumName = 'A definir';
    if (match.stadium_id) {
      const foundStadium = await getStadiumById(match.stadium_id);
      if (foundStadium) {
        stadiumName = foundStadium.name;
      }
    }
    
    return `⚽ ÚLTIMO JOGO DO ${team.name.toUpperCase()} ⚽\n${match.home_team} x ${match.away_team}\n📅 Data: ${formattedDate}\n⏰ Hora: ${formattedTime}\n\n🏆 Competição: ${match.competition}\n📍 Rodada: ${match.round_name || 'A definir'}\n🏟️ Estádio: ${stadiumName}\n\n🆚 Placar: A definir\n\nRelembrando o jogo! ⚽`;
    
  } catch (error) {
    console.error('❌ Erro ao buscar último jogo:', error);
    return '❌ Erro ao buscar último jogo.';
  }
}

// Buscar posição do time
async function getTeamPosition(client, teamName) {
  try {
    console.log(`🔍 Buscando posição para: ${teamName}`);
    
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
    console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`);

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

    console.log(`📊 Dados de posição encontrados:`, positionResult.rows);

    if (positionResult.rows.length === 0) {
      return `😔 Não encontrei a posição do ${team.name} em nenhuma competição.`;
    }

    const positionData = positionResult.rows[0];
    const position = positionData.position || 'N/A';
    const points = positionData.points || 0;
    const competitionName = positionData.competition_name || 'Competição não identificada';

    return `📊 POSIÇÃO DO ${team.name.toUpperCase()} 📊\n\nEm ${competitionName}, o ${team.name} está na *${position}ª posição* com *${points} pontos*.`;

  } catch (error) {
    console.error('❌ Erro ao buscar posição do time:', error);
    return '❌ Erro ao buscar posição do time.';
  }
}

// Buscar artilheiros
async function getTopScorers(client, competitionName) {
  try {
    console.log(`🔍 Buscando artilheiros para: ${competitionName}`);
    
    // Melhorar a busca de competições
    let searchTerm = competitionName;
    if (competitionName === 'brasileirao') {
      searchTerm = 'brasileirão';
    }
    
    const competitionResult = await client.query(`
      SELECT id, name 
      FROM competitions 
      WHERE LOWER(name) LIKE $1 OR LOWER(name) LIKE $2
      LIMIT 1
    `, [`%${searchTerm}%`, `%${competitionName}%`]);
    
    console.log(`🔍 Resultado da busca de competição:`, competitionResult.rows);
    
    if (competitionResult.rows.length === 0) {
      // Listar competições disponíveis para debug
      const allCompetitions = await client.query('SELECT name FROM competitions ORDER BY name');
      console.log('📋 Competições disponíveis:', allCompetitions.rows.map(c => c.name));
      return `❌ Competição "${competitionName}" não encontrada.\n\n📋 Competições disponíveis: ${allCompetitions.rows.map(c => c.name).join(', ')}`;
    }
    
    const competition = competitionResult.rows[0];
    console.log(`✅ Competição encontrada: ${competition.name} (ID: ${competition.id})`);

    // Verificar se a tabela goal_scorers existe
    try {
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

      console.log(`⚽ Artilheiros encontrados: ${scorersResult.rows.length}`);

      if (scorersResult.rows.length === 0) {
        return `⚽️ ARTILHARIA - ${competition.name.toUpperCase()} ⚽️\n\n😔 Ainda não há dados de artilharia disponíveis.`;
      }

      let response = `⚽️ ARTILHARIA - ${competition.name.toUpperCase()} ⚽️\n\n`;
      scorersResult.rows.forEach((scorer, index) => {
        response += `${index + 1}º - ${scorer.player_name} (${scorer.team_name}) - ${scorer.goals} gols\n`;
      });

      return response;
      
    } catch (tableError) {
      console.log('⚠️ Tabela goal_scorers não existe, tentando alternativa...');
      
      // Alternativa: buscar dados de gols das partidas (se existir)
      try {
        const alternativeResult = await client.query(`
          SELECT table_name
          FROM information_schema.tables 
          WHERE table_name IN ('match_events', 'goals', 'player_stats')
          ORDER BY table_name
        `);
        
        console.log('📋 Tabelas de estatísticas disponíveis:', alternativeResult.rows.map(r => r.table_name));
        
        if (alternativeResult.rows.length === 0) {
          return `⚽️ ARTILHARIA - ${competition.name.toUpperCase()} ⚽️\n\n😔 Sistema de artilharia ainda não foi implementado no banco de dados.\n\n🔧 Status: Aguardando criação das tabelas de estatísticas de jogadores.\n\n📋 Tabelas necessárias:\n* goal_scorers\n* match_events\n* player_stats`;
        } else {
          return `⚽️ ARTILHARIA - ${competition.name.toUpperCase()} ⚽️\n\n🔧 Sistema de artilharia em desenvolvimento.\n\n📋 Tabelas encontradas: ${alternativeResult.rows.map(r => r.table_name).join(', ')}\n\n💡 Em breve: Dados de artilheiros estarão disponíveis!`;
        }
        
      } catch (altError) {
        console.error('❌ Erro ao verificar tabelas alternativas:', altError.message);
        return `⚽️ ARTILHARIA - ${competition.name.toUpperCase()} ⚽️\n\n😔 Sistema de artilharia ainda não foi implementado no banco de dados.\n\n🔧 Status: Aguardando criação das tabelas de estatísticas de jogadores.`;
      }
    }

  } catch (error) {
    console.error('❌ Erro ao buscar artilheiros:', error.message);
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
runTests();

module.exports = {
  processMessage
}; 