const fs = require('fs');
const { Client } = require('pg');

async function executeAliasesSQL() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'devuser',
    password: 'devuser',
    database: 'kmiza27_dev'
  });

  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sql = fs.readFileSync('add-aliases-column.sql', 'utf8');
    console.log('📄 Arquivo SQL carregado');

    // Executar o SQL
    await client.query(sql);
    console.log('✅ Script SQL executado com sucesso');

    // Verificar os resultados
    const result = await client.query('SELECT name, aliases FROM teams WHERE aliases IS NOT NULL');
    console.log(`\n📊 Times com aliases (${result.rows.length}):`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}: ${JSON.stringify(row.aliases)}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Desconectado do banco de dados');
  }
}

executeAliasesSQL(); 