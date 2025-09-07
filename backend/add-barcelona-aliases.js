#!/usr/bin/env node

/**
 * Script para adicionar aliases do Barcelona
 */

const { createConnection } = require('typeorm');
require('dotenv').config();

async function addBarcelonaAliases() {
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
    console.log('📊 Buscando times Barcelona...');
    
    const barcelonaTeams = await connection.query(`
      SELECT id, name, short_name, aliases, city, state, country 
      FROM teams 
      WHERE LOWER(name) LIKE '%barcelona%'
      ORDER BY name
    `);

    if (barcelonaTeams.length === 0) {
      console.log('❌ Nenhum time Barcelona encontrado!');
      return;
    }

    console.log(`\n✅ Encontrados ${barcelonaTeams.length} times Barcelona:`);
    barcelonaTeams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (ID: ${team.id})`);
      console.log(`   Localização: ${team.city || 'N/A'}/${team.state || 'N/A'} - ${team.country || 'N/A'}`);
      console.log(`   Aliases atuais: ${team.aliases ? JSON.stringify(team.aliases) : 'Nenhuma'}`);
      console.log('');
    });

    // Encontrar Barcelona da Espanha (provável prioridade)
    const barcelonaEsp = barcelonaTeams.find(team => 
      team.name.toLowerCase().includes('esp') || 
      team.country?.toLowerCase() === 'espanha' ||
      team.name.toLowerCase() === 'barcelona'
    );

    if (barcelonaEsp) {
      console.log(`🎯 Barcelona principal identificado: ${barcelonaEsp.name} (ID: ${barcelonaEsp.id})`);
      
      const currentAliases = barcelonaEsp.aliases || [];
      const newAliases = ['barca', 'barça', 'fcb', 'barcelona'];
      
      // Mesclar aliases, removendo duplicatas
      const allAliases = [...new Set([...currentAliases, ...newAliases])];
      
      console.log(`📝 Atualizando aliases para: ${JSON.stringify(allAliases)}`);
      
      await connection.query(`
        UPDATE teams 
        SET aliases = $1
        WHERE id = $2
      `, [JSON.stringify(allAliases), barcelonaEsp.id]);
      
      console.log('✅ Aliases do Barcelona atualizadas com sucesso!');
    }

    // Adicionar aliases para outros Barcelonas se necessário
    for (const team of barcelonaTeams) {
      if (team.id !== barcelonaEsp?.id) {
        const currentAliases = team.aliases || [];
        const countryCode = team.name.split('-')[1]?.toLowerCase() || 
                           team.country?.substring(0, 3).toLowerCase();
        
        if (countryCode && !currentAliases.includes(`barcelona-${countryCode}`)) {
          const newAliases = [...currentAliases, `barcelona-${countryCode}`];
          
          console.log(`📝 Adicionando alias para ${team.name}: barcelona-${countryCode}`);
          
          await connection.query(`
            UPDATE teams 
            SET aliases = $1
            WHERE id = $2
          `, [JSON.stringify(newAliases), team.id]);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.close();
    console.log('🔌 Conexão fechada.');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addBarcelonaAliases().catch(console.error);
}

module.exports = { addBarcelonaAliases };