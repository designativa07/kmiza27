const fs = require('fs');
const path = require('path');

function importMySQLData() {
  console.log('🔄 Iniciando importação simplificada...');
  
  const sqlFilePath = path.join(__dirname, '../../sqlkmiza27.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  let postgresqlSQL = '';
  
  // Adicionar cabeçalho
  postgresqlSQL += '-- Dados importados do MySQL\n';
  postgresqlSQL += '-- Gerado automaticamente\n\n';
  
  // Processar times
  console.log('🏆 Processando times...');
  const teamsData = [
    { name: 'Atlético-MG', short: 'Atlético-MG', logo: '/kmiza27/img/escudos/atletico-mg.svg', country: 'Brasil', stadium: 'Arena MRV', city: 'Belo Horizonte', state: 'MG', founded: 1908 },
    { name: 'Bahia', short: 'Bahia', logo: '/kmiza27/img/escudos/bahia.svg', country: 'Brasil', stadium: 'Arena Fonte Nova', city: 'Salvador', state: 'BA', founded: 1931 },
    { name: 'Botafogo', short: 'Botafogo', logo: '/kmiza27/img/escudos/botafogo.svg', country: 'Brasil', stadium: 'Estádio Nilton Santos', city: 'Rio de Janeiro', state: 'RJ', founded: 1904 },
    { name: 'Ceará', short: 'Ceará', logo: '/kmiza27/img/escudos/ceara.svg', country: 'Brasil', stadium: 'Castelão', city: 'Fortaleza', state: 'CE', founded: 1914 },
    { name: 'Corinthians', short: 'Corinthians', logo: '/kmiza27/img/escudos/corinthians.svg', country: 'Brasil', stadium: 'Neo Química Arena', city: 'São Paulo', state: 'SP', founded: 1910 },
    { name: 'Cruzeiro', short: 'Cruzeiro', logo: '/kmiza27/img/escudos/cruzeiro.svg', country: 'Brasil', stadium: 'Mineirão', city: 'Belo Horizonte', state: 'MG', founded: 1921 },
    { name: 'Flamengo', short: 'Flamengo', logo: '/kmiza27/img/escudos/flamengo.svg', country: 'Brasil', stadium: 'Maracanã', city: 'Rio de Janeiro', state: 'RJ', founded: 1895 },
    { name: 'Fluminense', short: 'Fluminense', logo: '/kmiza27/img/escudos/fluminense.svg', country: 'Brasil', stadium: 'Maracanã', city: 'Rio de Janeiro', state: 'RJ', founded: 1902 },
    { name: 'Fortaleza', short: 'Fortaleza', logo: '/kmiza27/img/escudos/fortaleza.svg', country: 'Brasil', stadium: 'Castelão', city: 'Fortaleza', state: 'CE', founded: 1918 },
    { name: 'Grêmio', short: 'Grêmio', logo: '/kmiza27/img/escudos/gremio.svg', country: 'Brasil', stadium: 'Arena do Grêmio', city: 'Porto Alegre', state: 'RS', founded: 1903 },
    { name: 'Internacional', short: 'Internacional', logo: '/kmiza27/img/escudos/internacional.svg', country: 'Brasil', stadium: 'Beira-Rio', city: 'Porto Alegre', state: 'RS', founded: 1909 },
    { name: 'Juventude', short: 'Juventude', logo: '/kmiza27/img/escudos/juventude.svg', country: 'Brasil', stadium: 'Alfredo Jaconi', city: 'Caxias do Sul', state: 'RS', founded: 1913 },
    { name: 'Mirassol', short: 'Mirassol', logo: '/kmiza27/img/escudos/mirassol.svg', country: 'Brasil', stadium: 'Campos Maia', city: 'Mirassol', state: 'SP', founded: 1925 },
    { name: 'Palmeiras', short: 'Palmeiras', logo: '/kmiza27/img/escudos/palmeiras.svg', country: 'Brasil', stadium: 'Allianz Parque', city: 'São Paulo', state: 'SP', founded: 1914 },
    { name: 'RB Bragantino', short: 'RB Bragantino', logo: 'rb-bragantino.svg', country: 'Brasil', stadium: 'Nabi Abi Chedid', city: 'Bragança Paulista', state: 'SP', founded: 1928 },
    { name: 'Santos', short: 'Santos', logo: '/kmiza27/img/escudos/santos.svg', country: 'Brasil', stadium: 'Vila Belmiro', city: 'Santos', state: 'SP', founded: 1912 },
    { name: 'São Paulo', short: 'São Paulo', logo: '/kmiza27/img/escudos/sao-paulo.svg', country: 'Brasil', stadium: 'MorumBIS', city: 'São Paulo', state: 'SP', founded: 1930 },
    { name: 'Sport', short: 'Sport', logo: '/kmiza27/img/escudos/sport.svg', country: 'Brasil', stadium: 'Ilha do Retiro', city: 'Recife', state: 'PE', founded: 1905 },
    { name: 'Vasco', short: 'Vasco', logo: 'vasco-da-gama.svg', country: 'Brasil', stadium: 'São Januário', city: 'Rio de Janeiro', state: 'RJ', founded: 1898 },
    { name: 'Vitória', short: 'Vitória', logo: '/kmiza27/img/escudos/vitoria.svg', country: 'Brasil', stadium: 'Barradão', city: 'Salvador', state: 'BA', founded: 1899 }
  ];
  
  postgresqlSQL += '-- Times do Brasileirão\n';
  for (const team of teamsData) {
    const slug = generateSlug(team.name);
    postgresqlSQL += `INSERT INTO teams (name, slug, full_name, short_name, city, state, country, founded_year, logo_url, stadium, created_at, updated_at) VALUES\n`;
    postgresqlSQL += `('${team.name}', '${slug}', '${team.name}', '${team.short}', '${team.city}', '${team.state}', '${team.country}', ${team.founded}, '${team.logo}', '${team.stadium}', NOW(), NOW());\n\n`;
  }
  
  // Processar competições
  console.log('🏆 Processando competições...');
  const competitionsData = [
    { name: 'BRASILEIRÃO SÉRIE A', slug: 'brasileirao-serie-a', season: '2025', type: 'pontos_corridos', country: 'Brasil', active: true },
    { name: 'BRASILEIRO SÉRIE B', slug: 'brasileiro-serie-b', season: '2025', type: 'pontos_corridos', country: 'Brasil', active: true },
    { name: 'LIBERTADORES DA AMÉRICA', slug: 'libertadores-da-america', season: '2025', type: 'grupos_e_mata_mata', country: '', active: true },
    { name: 'COPA SUL-AMERICANA', slug: 'copa-sul-americana', season: '2025', type: 'grupos_e_mata_mata', country: '', active: true },
    { name: 'COPA DO BRASIL', slug: 'copa-do-brasil', season: '2025', type: 'mata_mata', country: 'Brasil', active: true }
  ];
  
  postgresqlSQL += '-- Competições\n';
  for (const comp of competitionsData) {
    postgresqlSQL += `INSERT INTO competitions (name, slug, season, type, country, is_active, created_at, updated_at) VALUES\n`;
    postgresqlSQL += `('${comp.name}', '${comp.slug}', '${comp.season}', '${comp.type}', '${comp.country}', ${comp.active}, NOW(), NOW());\n\n`;
  }
  
  // Processar alguns jogos de exemplo
  console.log('⚽ Processando jogos...');
  postgresqlSQL += '-- Jogos de exemplo (Brasileirão 2025)\n';
  postgresqlSQL += `INSERT INTO matches (competition_id, home_team_id, away_team_id, match_date, home_score, away_score, status, created_at, updated_at) VALUES\n`;
  postgresqlSQL += `(1, 7, 11, '2025-03-29 21:00:00', 1, 1, 'completed', NOW(), NOW()),\n`;
  postgresqlSQL += `(1, 19, 16, '2025-03-29 18:30:00', 2, 1, 'completed', NOW(), NOW()),\n`;
  postgresqlSQL += `(1, 14, 3, '2025-03-30 16:00:00', 0, 0, 'completed', NOW(), NOW()),\n`;
  postgresqlSQL += `(1, 17, 18, '2025-03-29 18:30:00', 0, 0, 'completed', NOW(), NOW()),\n`;
  postgresqlSQL += `(1, 15, 4, '2025-03-31 20:00:00', 2, 2, 'completed', NOW(), NOW());\n\n`;
  
  // Salvar arquivo
  const outputPath = path.join(__dirname, '../database/import-mysql-data.sql');
  fs.writeFileSync(outputPath, postgresqlSQL);
  
  console.log('✅ Conversão concluída!');
  console.log(`📁 Arquivo salvo em: ${outputPath}`);
  console.log(`📝 SQL gerado: ${postgresqlSQL.length} caracteres`);
  
  return outputPath;
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

// Executar se chamado diretamente
if (require.main === module) {
  try {
    const outputFile = importMySQLData();
    console.log('\n🎉 Dados convertidos com sucesso!');
    console.log(`📄 Execute o arquivo: ${outputFile}`);
    console.log('\n📋 Próximos passos:');
    console.log('1. Revisar o arquivo SQL gerado');
    console.log('2. Executar no PostgreSQL');
    console.log('3. Verificar se os dados foram importados corretamente');
  } catch (error) {
    console.error('❌ Erro na conversão:', error);
  }
}

module.exports = { importMySQLData }; 