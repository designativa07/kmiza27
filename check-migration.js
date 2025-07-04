const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27',
  user: 'postgres',
  password: 'postgres'
});

async function checkRoundsTable() {
  try {
    await client.connect();
    
    // Verificar se a tabela rounds existe e suas colunas
    const tableInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rounds'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Colunas da tabela rounds:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Verificar se o campo display_order existe
    const hasDisplayOrder = tableInfo.rows.some(row => row.column_name === 'display_order');
    console.log(`\n✅ Campo display_order existe: ${hasDisplayOrder}`);
    
    if (!hasDisplayOrder) {
      console.log('❌ Migration não foi aplicada. Executando...');
      
      // Adicionar coluna display_order
      await client.query('ALTER TABLE rounds ADD COLUMN display_order INTEGER;');
      
      // Atualizar valores existentes
      await client.query(`
        UPDATE rounds 
        SET display_order = (
          SELECT COUNT(*) + 1 
          FROM rounds r2 
          WHERE r2.competition_id = rounds.competition_id 
          AND r2.id < rounds.id
        )
      `);
      
      console.log('✅ Migration aplicada com sucesso!');
    }
    
    // Verificar alguns dados
    const sampleData = await client.query(`
      SELECT id, round_name, display_order, competition_id 
      FROM rounds 
      ORDER BY competition_id, display_order 
      LIMIT 5;
    `);
    
    console.log('\n📋 Dados de exemplo:');
    sampleData.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Nome: ${row.round_name}, Order: ${row.display_order}, Comp: ${row.competition_id}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkRoundsTable(); 