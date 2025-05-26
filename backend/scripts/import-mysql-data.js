const fs = require('fs');
const path = require('path');

// Função para converter dados do MySQL para PostgreSQL
function convertMySQLToPostgreSQL() {
  console.log('🔄 Iniciando conversão de dados MySQL para PostgreSQL...');
  
  // Ler o arquivo SQL do MySQL
  const sqlFilePath = path.join(__dirname, '../../sqlkmiza27.sql');
  console.log(`📁 Lendo arquivo: ${sqlFilePath}`);
  
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`Arquivo não encontrado: ${sqlFilePath}`);
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  console.log(`📊 Arquivo lido com ${sqlContent.length} caracteres`);
  
  // Dividir em linhas
  const lines = sqlContent.split('\n');
  
  let postgresqlSQL = '';
  let currentTable = '';
  
  // Mapear nomes de tabelas MySQL para PostgreSQL
  const tableMapping = {
    'teams': 'teams',
    'competitions': 'competitions', 
    'games': 'matches',
    'channels': 'channels',
    'game_broadcasts': 'match_broadcasts'
  };
  
  // Mapear campos MySQL para PostgreSQL
  const fieldMapping = {
    // Teams
    'name': 'name',
    'short_name': 'short_name',
    'logo_url': 'logo_url',
    'country': 'country',
    'stadium': 'stadium',
    'website': 'website',
    
    // Competitions
    'season_year': 'season',
    'type': 'type',
    'continent': 'continent',
    
    // Games/Matches
    'competition_id': 'competition_id',
    'home_team_id': 'home_team_id',
    'away_team_id': 'away_team_id',
    'match_date': 'match_date',
    'match_time': 'match_time',
    'home_score': 'home_score',
    'away_score': 'away_score',
    'status': 'status',
    'round': 'round_name',
    'group_name': 'group_name'
  };
  
  console.log('📊 Processando dados...');
  console.log(`📄 Total de linhas: ${lines.length}`);
  
  let teamsCount = 0;
  let competitionsCount = 0;
  let matchesCount = 0;
  let channelsCount = 0;
  
  for (let line of lines) {
    line = line.trim();
    
    // Detectar inserções de times
    if (line.includes('INSERT INTO desig938_kmiza27games.teams')) {
      currentTable = 'teams';
      teamsCount++;
      console.log(`🏆 Processando times (linha ${teamsCount})`);
      postgresqlSQL += convertTeamsInsert(line);
    }
    // Detectar inserções de competições
    else if (line.includes('INSERT INTO desig938_kmiza27games.competitions')) {
      currentTable = 'competitions';
      competitionsCount++;
      console.log(`🏆 Processando competições (linha ${competitionsCount})`);
      postgresqlSQL += convertCompetitionsInsert(line);
    }
    // Detectar inserções de jogos
    else if (line.includes('INSERT INTO desig938_kmiza27games.games')) {
      currentTable = 'matches';
      matchesCount++;
      console.log(`⚽ Processando jogos (linha ${matchesCount})`);
      postgresqlSQL += convertMatchesInsert(line);
    }
    // Detectar inserções de canais
    else if (line.includes('INSERT INTO desig938_kmiza27games.channels')) {
      currentTable = 'channels';
      channelsCount++;
      console.log(`📺 Processando canais (linha ${channelsCount})`);
      postgresqlSQL += convertChannelsInsert(line);
    }
  }
  
  console.log(`\n📊 Resumo do processamento:`);
  console.log(`🏆 Times: ${teamsCount} linhas`);
  console.log(`🏆 Competições: ${competitionsCount} linhas`);
  console.log(`⚽ Jogos: ${matchesCount} linhas`);
  console.log(`📺 Canais: ${channelsCount} linhas`);
  console.log(`📝 SQL gerado: ${postgresqlSQL.length} caracteres`);
  
  // Salvar arquivo PostgreSQL
  const outputPath = path.join(__dirname, '../database/import-mysql-data.sql');
  fs.writeFileSync(outputPath, postgresqlSQL);
  
  console.log('✅ Conversão concluída!');
  console.log(`📁 Arquivo salvo em: ${outputPath}`);
  
  return outputPath;
}

function convertTeamsInsert(line) {
  console.log(`🔍 Convertendo linha de times: ${line.substring(0, 100)}...`);
  // Extrair dados dos times - ajustado para lidar com NULL
  const regex = /\('([^']*?)','([^']*?)','([^']*?)','([^']*?)','([^']*?)',(NULL|'[^']*?'),'([^']*?)','([^']*?)'\)/g;
  let match;
  let sql = '';
  
  while ((match = regex.exec(line)) !== null) {
    const [, name, shortName, logoUrl, country, stadium, website, createdAt, updatedAt] = match;
    
    // Gerar slug a partir do nome
    const slug = generateSlug(name);
    
    // Determinar cidade e estado baseado no país e estádio
    let city = 'Não informado';
    let state = 'Não informado';
    let foundedYear = 1900;
    
    // Mapear alguns times conhecidos
    const teamData = getTeamData(name);
    if (teamData) {
      city = teamData.city;
      state = teamData.state;
      foundedYear = teamData.founded;
    }
    
    // Tratar website NULL
    const websiteValue = website === 'NULL' ? '' : website.replace(/'/g, '');
    
    sql += `INSERT INTO teams (name, slug, full_name, short_name, city, state, country, founded_year, logo_url, stadium, created_at, updated_at) VALUES\n`;
    sql += `('${name}', '${slug}', '${name}', '${shortName}', '${city}', '${state}', '${country}', ${foundedYear}, '${logoUrl}', '${stadium}', '${createdAt}', '${updatedAt}');\n\n`;
    console.log(`✅ Time convertido: ${name}`);
  }
  
  console.log(`📝 SQL de times gerado: ${sql.length} caracteres`);
  return sql;
}

function convertCompetitionsInsert(line) {
  const regex = /\('([^']*?)','([^']*?)','([^']*?)','([^']*?)','([^']*?)','([^']*?)',(\d+),'([^']*?)','([^']*?)'\)/g;
  let match;
  let sql = '';
  
  while ((match = regex.exec(line)) !== null) {
    const [, name, season, type, country, continent, logoUrl, active, createdAt, updatedAt] = match;
    
    sql += `INSERT INTO competitions (name, season, type, country, continent, logo_url, is_active, created_at, updated_at) VALUES\n`;
    sql += `('${name}', '${season}', '${type}', '${country}', '${continent}', '${logoUrl}', ${active === '1' ? 'true' : 'false'}, '${createdAt}', '${updatedAt}');\n\n`;
  }
  
  return sql;
}

function convertMatchesInsert(line) {
  const regex = /\((\d+),(\d+),(\d+),'([^']*?)','([^']*?)','([^']*?)',(\d+|NULL),(\d+|NULL),'([^']*?)','([^']*?)',([^']*?),'([^']*?)','([^']*?)'\)/g;
  let match;
  let sql = '';
  
  while ((match = regex.exec(line)) !== null) {
    const [, competitionId, homeTeamId, awayTeamId, matchDate, matchTime, stadium, homeScore, awayScore, status, round, groupName, createdAt, updatedAt] = match;
    
    // Combinar data e hora
    const matchDateTime = `${matchDate} ${matchTime}`;
    
    sql += `INSERT INTO matches (competition_id, home_team_id, away_team_id, match_date, home_score, away_score, status, created_at, updated_at) VALUES\n`;
    sql += `(${competitionId}, ${homeTeamId}, ${awayTeamId}, '${matchDateTime}', ${homeScore === 'NULL' ? 'NULL' : homeScore}, ${awayScore === 'NULL' ? 'NULL' : awayScore}, '${status}', '${createdAt}', '${updatedAt}');\n\n`;
  }
  
  return sql;
}

function convertChannelsInsert(line) {
  const regex = /\('([^']*?)','([^']*?)','([^']*?)','([^']*?)','([^']*?)',(\d+),'([^']*?)','([^']*?)'\)/g;
  let match;
  let sql = '';
  
  while ((match = regex.exec(line)) !== null) {
    const [, name, logo, channelNumber, channelLink, type, active, createdAt, updatedAt] = match;
    
    sql += `-- Canal: ${name}\n`;
    sql += `-- Tipo: ${type}, Ativo: ${active === '1' ? 'Sim' : 'Não'}\n`;
    sql += `-- Link: ${channelLink}\n\n`;
  }
  
  return sql;
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getTeamData(name) {
  const teamsData = {
    'Flamengo': { city: 'Rio de Janeiro', state: 'RJ', founded: 1895 },
    'Palmeiras': { city: 'São Paulo', state: 'SP', founded: 1914 },
    'Corinthians': { city: 'São Paulo', state: 'SP', founded: 1910 },
    'São Paulo': { city: 'São Paulo', state: 'SP', founded: 1930 },
    'Santos': { city: 'Santos', state: 'SP', founded: 1912 },
    'Botafogo': { city: 'Rio de Janeiro', state: 'RJ', founded: 1904 },
    'Vasco': { city: 'Rio de Janeiro', state: 'RJ', founded: 1898 },
    'Fluminense': { city: 'Rio de Janeiro', state: 'RJ', founded: 1902 },
    'Atlético-MG': { city: 'Belo Horizonte', state: 'MG', founded: 1908 },
    'Cruzeiro': { city: 'Belo Horizonte', state: 'MG', founded: 1921 },
    'Grêmio': { city: 'Porto Alegre', state: 'RS', founded: 1903 },
    'Internacional': { city: 'Porto Alegre', state: 'RS', founded: 1909 },
    'Bahia': { city: 'Salvador', state: 'BA', founded: 1931 },
    'Vitória': { city: 'Salvador', state: 'BA', founded: 1899 },
    'Fortaleza': { city: 'Fortaleza', state: 'CE', founded: 1918 },
    'Ceará': { city: 'Fortaleza', state: 'CE', founded: 1914 },
    'Sport': { city: 'Recife', state: 'PE', founded: 1905 },
    'Náutico': { city: 'Recife', state: 'PE', founded: 1901 },
    'Athlético-PR': { city: 'Curitiba', state: 'PR', founded: 1924 },
    'Coritiba': { city: 'Curitiba', state: 'PR', founded: 1909 },
    'Atlético-GO': { city: 'Goiânia', state: 'GO', founded: 1937 },
    'Goiás': { city: 'Goiânia', state: 'GO', founded: 1943 },
    'Cuiabá': { city: 'Cuiabá', state: 'MT', founded: 2001 },
    'América-MG': { city: 'Belo Horizonte', state: 'MG', founded: 1912 },
    'Juventude': { city: 'Caxias do Sul', state: 'RS', founded: 1913 },
    'Chapecoense': { city: 'Chapecó', state: 'SC', founded: 1973 },
    'Criciúma': { city: 'Criciúma', state: 'SC', founded: 1947 },
    'Avaí': { city: 'Florianópolis', state: 'SC', founded: 1923 },
    'Figueirense': { city: 'Florianópolis', state: 'SC', founded: 1921 },
    'Brusque': { city: 'Brusque', state: 'SC', founded: 1987 }
  };
  
  return teamsData[name] || null;
}

// Executar se chamado diretamente
if (require.main === module) {
  try {
    const outputFile = convertMySQLToPostgreSQL();
    console.log('\n🎉 Dados convertidos com sucesso!');
    console.log(`📄 Execute o arquivo: ${outputFile}`);
    console.log('\n📋 Próximos passos:');
    console.log('1. Revisar o arquivo SQL gerado');
    console.log('2. Executar no PostgreSQL: psql -d kmiza27_chatbot -f backend/database/import-mysql-data.sql');
    console.log('3. Verificar se os dados foram importados corretamente');
  } catch (error) {
    console.error('❌ Erro na conversão:', error);
  }
}

module.exports = { convertMySQLToPostgreSQL }; 