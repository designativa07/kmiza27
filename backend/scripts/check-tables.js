const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estrutura do banco de dados...\n');
    
    // Listar todas as tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 TABELAS EXISTENTES:');
    console.log('======================');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Verificar estrutura das principais tabelas
    const mainTables = ['teams', 'competitions', 'matches', 'stadiums', 'rounds'];
    
    for (const tableName of mainTables) {
      console.log(`\n🔧 ESTRUTURA DA TABELA: ${tableName.toUpperCase()}`);
      console.log('='.repeat(40));
      
      try {
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (columnsResult.rows.length > 0) {
          columnsResult.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
          });
        } else {
          console.log(`  ❌ Tabela '${tableName}' não encontrada!`);
        }
      } catch (error) {
        console.log(`  ❌ Erro ao verificar tabela '${tableName}': ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a verificação
checkTables(); 