const { Client } = require('pg');

async function checkStadiumColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'h4xd66.easypanel.host',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: process.env.DB_DATABASE || 'kmiza27',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar estrutura da tabela stadiums
    console.log('🔍 Verificando estrutura da tabela stadiums...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stadiums' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Colunas da tabela stadiums:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar se as colunas específicas existem
    const specificColumns = ['opened_year', 'history', 'image_url'];
    console.log('\n🎯 Verificando colunas específicas:');
    
    for (const column of specificColumns) {
      const exists = checkResult.rows.some(row => row.column_name === column);
      console.log(`  - ${column}: ${exists ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
    }

    // Tentar fazer um SELECT simples na tabela stadiums
    console.log('\n🧪 Testando SELECT na tabela stadiums...');
    try {
      const testResult = await client.query('SELECT id, name, opened_year, history, image_url FROM stadiums LIMIT 1');
      console.log('✅ SELECT funcionou! Dados encontrados:', testResult.rows.length);
      if (testResult.rows.length > 0) {
        console.log('📄 Primeiro registro:', testResult.rows[0]);
      }
    } catch (error) {
      console.log('❌ Erro no SELECT:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

checkStadiumColumns(); 