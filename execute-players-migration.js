const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: 'h4xd66.easypanel.host',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  ssl: false
};

async function executeMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-players-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executando script SQL...');
    
    // Dividir o SQL em comandos individuais e executar
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`📝 Executando comando ${i + 1}/${commands.length}...`);
          const result = await client.query(command);
          
          // Se for um SELECT, mostrar os resultados
          if (command.toLowerCase().includes('select')) {
            console.log('📊 Resultados:', result.rows);
          }
        } catch (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          console.log('🔍 Comando que falhou:', command.substring(0, 100) + '...');
        }
      }
    }

    console.log('✅ Migração concluída com sucesso!');
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('players', 'player_team_history', 'cards')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.map(row => row.table_name));
    
    // Contar registros
    for (const table of ['players', 'player_team_history', 'cards']) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📊 ${table}: ${countResult.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ Erro ao contar ${table}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco de dados fechada');
  }
}

// Executar a migração
executeMigration().catch(console.error); 