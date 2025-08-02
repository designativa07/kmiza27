const { Client } = require('pg');

async function checkAliasesData() {
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

    const result = await client.query('SELECT name, aliases FROM teams WHERE aliases IS NOT NULL');
    
    console.log(`📊 Encontrados ${result.rows.length} times com aliases:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}: ${JSON.stringify(row.aliases)}`);
    });

    if (result.rows.length === 0) {
      console.log('⚠️ Nenhum time com aliases encontrado. Executando script de inserção...');
      
      // Executar o script SQL para inserir aliases
             const insertQueries = [
         "UPDATE teams SET aliases = '[\"fogão\", \"fogao\", \"estrela\", \"solitária\", \"solitaria\"]'::jsonb WHERE name = 'Botafogo';",
         "UPDATE teams SET aliases = '[\"mengão\", \"mengao\", \"fla\"]'::jsonb WHERE name = 'Flamengo';",
         "UPDATE teams SET aliases = '[\"vascão\", \"vascao\"]'::jsonb WHERE name = 'Vasco';",
         "UPDATE teams SET aliases = '[\"verdão\", \"verdao\"]'::jsonb WHERE name = 'Palmeiras';",
         "UPDATE teams SET aliases = '[\"timão\", \"timao\"]'::jsonb WHERE name = 'Corinthians';",
         "UPDATE teams SET aliases = '[\"são paulo\", \"sao paulo\", \"spfc\"]'::jsonb WHERE name = 'São Paulo';",
         "UPDATE teams SET aliases = '[\"peixe\"]'::jsonb WHERE name = 'Santos';"
       ];

      for (const query of insertQueries) {
        try {
          await client.query(query);
          console.log('✅ Query executada com sucesso');
        } catch (error) {
          console.log(`⚠️ Erro na query: ${error.message}`);
        }
      }

      // Verificar novamente
      const newResult = await client.query('SELECT name, aliases FROM teams WHERE aliases IS NOT NULL');
      console.log(`\n📊 Após inserção: ${newResult.rows.length} times com aliases:\n`);
      
      newResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.name}: ${JSON.stringify(row.aliases)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Desconectado do banco de dados');
  }
}

checkAliasesData(); 