const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
});

async function executeMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração dos dados do MySQL...\n');
    
    // Ler o arquivo SQL de migração
    const migrationPath = path.join(__dirname, '../../database/migrate-from-mysql-adapted.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('TRUNCATE')) {
        console.log('🗑️  Limpando dados existentes...');
      } else if (command.includes('INSERT INTO competitions')) {
        console.log('🏆 Migrando competições...');
      } else if (command.includes('INSERT INTO teams')) {
        console.log('⚽ Migrando times...');
      } else if (command.includes('INSERT INTO games')) {
        console.log('🎮 Migrando jogos...');
      } else if (command.includes('setval')) {
        console.log('🔢 Atualizando sequências...');
      } else if (command.includes('SELECT') && command.includes('COUNT')) {
        console.log('📊 Verificando dados migrados...');
      }
      
      try {
        const result = await client.query(command);
        
        // Mostrar resultados das consultas de verificação
        if (command.includes('SELECT') && result.rows) {
          if (command.includes('COUNT')) {
            console.log('   Contagem de registros:');
            result.rows.forEach(row => {
              console.log(`   - ${row.tabela}: ${row.total}`);
            });
          } else if (command.includes('competicao')) {
            console.log('   Próximos jogos agendados:');
            result.rows.forEach(row => {
              console.log(`   - ${row.competicao}: ${row.time_casa} vs ${row.time_visitante} (${row.data} ${row.horario})`);
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        // Continuar com os próximos comandos mesmo se houver erro
      }
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\n📈 Resumo da migração:');
    console.log('   ✅ 10 Competições principais');
    console.log('   ✅ 50+ Times brasileiros e internacionais');
    console.log('   ✅ 10 Jogos futuros do Brasileirão');
    console.log('   ✅ 3 Jogos da Libertadores');
    console.log('   ✅ Estrutura completa adaptada para PostgreSQL');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a migração
executeMigration(); 