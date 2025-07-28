const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkMatchesTable() {
  try {
    console.log('Verificando estrutura da tabela matches...');
    
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'matches'
      );
    `);
    
    console.log('Tabela matches existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Verificar colunas da tabela
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'matches'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nColunas da tabela matches:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Verificar se a coluna category existe
      const categoryExists = columns.rows.find(col => col.column_name === 'category');
      console.log('\nColuna category existe:', !!categoryExists);
      
      // Verificar dados de exemplo
      const sampleData = await pool.query(`
        SELECT id, competition_id, home_team_id, away_team_id, category, status
        FROM matches
        LIMIT 5;
      `);
      
      console.log('\nDados de exemplo:');
      sampleData.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Category: ${row.category}, Status: ${row.status}`);
      });
      
      // Verificar jogo específico
      const match1453 = await pool.query(`
        SELECT id, competition_id, home_team_id, away_team_id, category, status
        FROM matches
        WHERE id = 1453;
      `);
      
      console.log('\nJogo 1453:');
      if (match1453.rows.length > 0) {
        console.log(match1453.rows[0]);
      } else {
        console.log('Jogo 1453 não encontrado');
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  } finally {
    await pool.end();
  }
}

checkMatchesTable(); 