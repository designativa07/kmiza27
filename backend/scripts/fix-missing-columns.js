const { Client } = require('pg');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

async function fixMissingColumns() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    console.log('🔧 Corrigindo Colunas Faltantes');
    console.log('===============================');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Adicionar colunas faltantes
    const columnFixes = [
      {
        table: 'teams',
        column: 'goal_difference',
        type: 'INTEGER DEFAULT 0',
        description: 'Diferença de gols do time'
      },
      {
        table: 'simulation_results',
        column: 'round_number',
        type: 'INTEGER',
        description: 'Número da rodada da simulação'
      }
    ];

    for (const fix of columnFixes) {
      try {
        console.log(`\n🔧 Adicionando coluna ${fix.column} à tabela ${fix.table}...`);
        
        // Verificar se a coluna já existe
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${fix.table}' AND column_name = '${fix.column}'
        `);
        
        if (checkResult.rows.length > 0) {
          console.log(`   ✅ Coluna ${fix.column} já existe na tabela ${fix.table}`);
        } else {
          await client.query(`ALTER TABLE ${fix.table} ADD COLUMN ${fix.column} ${fix.type};`);
          console.log(`   ✅ Coluna ${fix.column} adicionada com sucesso!`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao adicionar coluna ${fix.column}: ${error.message}`);
      }
    }

    // Verificar estrutura das tabelas corrigidas
    console.log('\n🔍 Verificando estrutura das tabelas corrigidas...');
    
    for (const fix of columnFixes) {
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${fix.table}' 
          ORDER BY ordinal_position
        `);
        
        console.log(`\n📋 Colunas da tabela ${fix.table}:`);
        result.rows.forEach(row => {
          const nullable = row.is_nullable === 'YES' ? 'nullable' : 'not null';
          const defaultValue = row.column_default ? ` (default: ${row.column_default})` : '';
          console.log(`   - ${row.column_name}: ${row.data_type} (${nullable})${defaultValue}`);
        });
        
      } catch (error) {
        console.log(`   ❌ Erro ao verificar tabela ${fix.table}: ${error.message}`);
      }
    }

    console.log('\n🎉 Correção de colunas concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await client.end();
  }
}

fixMissingColumns();

