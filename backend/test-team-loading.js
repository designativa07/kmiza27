#!/usr/bin/env node

/**
 * Script para testar o carregamento de nomes de times e aliases
 */

const { createConnection } = require('typeorm');
require('dotenv').config();

async function testTeamLoading() {
  console.log('🔧 Conectando ao banco de dados...');
  
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'kmiza27_dev',
    logging: false
  });

  try {
    console.log('📊 Testando carregamento de times como o OpenAIService faz...');
    
    // Simular o que OpenAIService.loadTeamNames() faz
    const teamNames = [];
    const teamsResult = await connection.query(`
      SELECT name, short_name, slug, aliases 
      FROM teams 
      ORDER BY name
      LIMIT 1000
    `);

    function removeAccents(str) {
      return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    }

    for (const team of teamsResult) {
      teamNames.push(removeAccents(team.name.toLowerCase()));
      if (team.short_name) {
        teamNames.push(removeAccents(team.short_name.toLowerCase()));
      }
      if (team.slug) {
        teamNames.push(removeAccents(team.slug.toLowerCase()));
      }
      // Adicionar aliases dinâmicos
      if (team.aliases && Array.isArray(team.aliases)) {
        for (const alias of team.aliases) {
          teamNames.push(removeAccents(alias.toLowerCase()));
        }
      }
    }
    
    const uniqueTeamNames = [...new Set(teamNames)].sort((a, b) => b.length - a.length);
    
    console.log(`✅ Total de ${uniqueTeamNames.length} nomes/aliases carregados`);
    
    // Verificar se aliases do Barcelona estão presentes
    const barcelonaAliases = uniqueTeamNames.filter(name => 
      name.includes('barca') || name.includes('barcelona') || name === 'fcb'
    );
    
    console.log('\n🎯 Aliases do Barcelona encontradas:');
    barcelonaAliases.forEach(alias => console.log(`  - ${alias}`));
    
    // Testar busca
    const testSearches = ['barca', 'barça', 'barcelona', 'fcb'];
    console.log('\n🔍 Testes de busca:');
    
    for (const search of testSearches) {
      const found = uniqueTeamNames.find(name => name === removeAccents(search.toLowerCase()));
      console.log(`  ${search}: ${found ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.close();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testTeamLoading().catch(console.error);
}

module.exports = { testTeamLoading };