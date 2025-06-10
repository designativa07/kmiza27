const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runPlayerStateMigration() {
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'add-player-state-column.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executando migration para adicionar coluna state...');
    
    // Executar cada comando SQL separadamente
    const commands = sqlContent.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`🔄 Executando: ${command.trim().substring(0, 50)}...`);
        const result = await client.query(command.trim());
        
        // Se for um SELECT, mostrar o resultado
        if (command.trim().toUpperCase().startsWith('SELECT')) {
          console.log('📊 Resultado:', result.rows);
        }
      }
    }
    
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar a estrutura final da tabela
    console.log('🔍 Verificando estrutura final da tabela players...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura da tabela players:');
    tableStructure.rows.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

runPlayerStateMigration(); 