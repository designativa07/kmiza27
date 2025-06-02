const { Pool } = require('pg');

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
        s.name as stadium,
        r.name as round_name,
        m.broadcast_channels
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN stadiums s ON m.stadium_id = s.id
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
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'
    });
    
    const isHome = match.home_team === team.name;
    const opponent = isHome ? match.away_team : match.home_team;
    const venue = isHome ? 'em casa' : 'fora de casa';
    
    let broadcastInfo = '';
    if (match.broadcast_channels && Array.isArray(match.broadcast_channels)) {
      broadcastInfo = `\n📺 **Transmissão:** ${match.broadcast_channels.join(', ')}`;
    }
    
    return `⚽ **PRÓXIMO JOGO DO ${team.name.toUpperCase()}** ⚽

📅 **Data:** ${formattedDate}
⏰ **Horário:** ${formattedTime}
🏆 **Competição:** ${match.competition}
🆚 **Adversário:** ${opponent}
🏟️ **Estádio:** ${match.stadium || 'A definir'}
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

// Processar mensagem
async function processMessage(message) {
  const client = await pool.connect();
  
  try {
    const analysis = analyzeMessage(message);
    console.log(`🧠 Intenção: ${analysis.intent} (${(analysis.confidence * 100).toFixed(0)}%)`);
    
    let response;
    
    switch (analysis.intent) {
      case 'next_match':
        response = await findNextMatch(client, analysis.team);
        break;
        
      case 'table':
        response = await getCompetitionTable(client, analysis.competition);
        break;
        
      case 'channels_info':
        response = await getChannelInfo(client);
        break;
        
      default:
        response = `👋 **Olá! Sou o Kmiza27 Bot** ⚽

🤖 Posso te ajudar com informações sobre futebol:

⚽ **Próximos jogos** - "Próximo jogo do Flamengo"
🏁 **Último jogo** - "Último jogo do Palmeiras"
ℹ️ **Info do time** - "Informações do Corinthians"  
📊 **Tabelas** - "Tabela do Brasileirão"
📍 **Posição** - "Posição do São Paulo"
📈 **Estatísticas** - "Estatísticas do Santos"
🥇 **Artilheiros** - "Artilheiros do Brasileirão"
📅 **Jogos hoje** - "Jogos de hoje"
📺 **Transmissão** - "Onde passa o jogo do Botafogo"
📡 **Canais** - "Lista de canais"
🗓️ **Jogos da semana** - "Jogos da semana"
🏆 **Competições** - "Estatísticas da Libertadores"

💬 **O que você gostaria de saber?**`;
    }
    
    return response;
    
  } finally {
    client.release();
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 TESTE DAS MELHORIAS DO KMIZA27 BOT 🚀\n');
  console.log('=' .repeat(60));
  
  const testMessages = [
    'Oi',
    'Próximo jogo do Flamengo',
    'Último jogo do Palmeiras',
    'Posição do Corinthians',
    'Estatísticas do São Paulo',
    'Artilheiros do Brasileirão',
    'Tabela do Brasileirão',
    'Lista de canais',
    'Onde passa o jogo do Santos',
    'Jogos da semana',
    'Jogos de hoje'
  ];
  
  for (let i = 0; i < testMessages.length; i++) {
    console.log(`\n🧪 TESTE ${i + 1}/${testMessages.length}`);
    console.log('-' .repeat(40));
    
    try {
      const response = await processMessage(testMessages[i]);
      console.log(`📝 Mensagem: "${testMessages[i]}"`);
      console.log(`🤖 Resposta:\n${response}\n`);
    } catch (error) {
      console.error(`❌ Erro no teste ${i + 1}:`, error.message);
    }
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Testes concluídos!');
  process.exit(0);
}

// Executar
runTests().catch(error => {
  console.error('❌ Erro geral:', error);
  process.exit(1);
}); 