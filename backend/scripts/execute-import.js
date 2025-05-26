const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function executeImport() {
  console.log('🔄 Iniciando execução da importação...');
  
  // Configuração do banco
  const pool = new Pool({
    host: '195.200.0.191',
    port: 5433,
    database: 'kmiza27',
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  });
  
  try {
    // Ler arquivo SQL
    const sqlFilePath = path.join(__dirname, '../database/import-mysql-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📁 Arquivo SQL lido com sucesso');
    console.log(`📊 Tamanho: ${sqlContent.length} caracteres`);
    
    // Conectar ao banco
    const client = await pool.connect();
    console.log('🔗 Conectado ao PostgreSQL');
    
    // Verificar dados existentes
    const existingTeams = await client.query('SELECT COUNT(*) FROM teams');
    const existingCompetitions = await client.query('SELECT COUNT(*) FROM competitions');
    const existingMatches = await client.query('SELECT COUNT(*) FROM matches');
    
    console.log(`📊 Dados existentes:`);
    console.log(`🏆 Times: ${existingTeams.rows[0].count}`);
    console.log(`🏆 Competições: ${existingCompetitions.rows[0].count}`);
    console.log(`⚽ Jogos: ${existingMatches.rows[0].count}`);
    
    // Dividir SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await client.query(command);
          successCount++;
          
                     // Log específico para cada tipo
           if (command.includes('INSERT INTO teams')) {
             const teamMatch = command.match(/VALUES\s*\('([^']+)'/);
             if (teamMatch) {
               console.log(`✅ Time adicionado: ${teamMatch[1]}`);
             }
           } else if (command.includes('INSERT INTO competitions')) {
             const compMatch = command.match(/VALUES\s*\('([^']+)'/);
             if (compMatch) {
               console.log(`🏆 Competição adicionada: ${compMatch[1]}`);
             }
           } else if (command.includes('INSERT INTO matches')) {
             console.log(`⚽ Jogos adicionados`);
           }
        } catch (error) {
          errorCount++;
          console.error(`❌ Erro no comando: ${error.message}`);
          console.error(`📝 Comando: ${command.substring(0, 100)}...`);
        }
      }
    }
    
    // Verificar dados após importação
    const newTeams = await client.query('SELECT COUNT(*) FROM teams');
    const newCompetitions = await client.query('SELECT COUNT(*) FROM competitions');
    const newMatches = await client.query('SELECT COUNT(*) FROM matches');
    
    console.log(`\\n📊 Dados após importação:`);
    console.log(`🏆 Times: ${newTeams.rows[0].count} (+${newTeams.rows[0].count - existingTeams.rows[0].count})`);
    console.log(`🏆 Competições: ${newCompetitions.rows[0].count} (+${newCompetitions.rows[0].count - existingCompetitions.rows[0].count})`);
    console.log(`⚽ Jogos: ${newMatches.rows[0].count} (+${newMatches.rows[0].count - existingMatches.rows[0].count})`);
    
    console.log(`\\n📈 Resultado da execução:`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    // Listar alguns times adicionados
    const sampleTeams = await client.query('SELECT name, city, state FROM teams ORDER BY created_at DESC LIMIT 5');
    console.log(`\\n🏆 Últimos times adicionados:`);
    sampleTeams.rows.forEach(team => {
      console.log(`   • ${team.name} (${team.city}/${team.state})`);
    });
    
    client.release();
    console.log('\\n🎉 Importação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeImport()
    .then(() => {
      console.log('\\n✅ Script finalizado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { executeImport }; 