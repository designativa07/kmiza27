// Script para verificar conflito real na base de dados com São Raimundo-RR
// O problema pode estar na base de dados real, não na lógica de detecção

const { Pool } = require('pg');

async function checkSaoRaimundoConflict() {
  console.log('🔍 Verificando conflito real na base de dados...\n');

  // Configuração do banco (ajustar conforme necessário)
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'kmiza27',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    // 1. Verificar se existe São Raimundo-RR na base
    console.log('📋 Verificando times com "sao raimundo" na base...');
    
    const saoRaimundoQuery = `
      SELECT id, name, short_name, slug, aliases 
      FROM teams 
      WHERE LOWER(name) LIKE '%sao raimundo%' 
         OR LOWER(short_name) LIKE '%sao raimundo%'
         OR LOWER(slug) LIKE '%sao raimundo%'
         OR aliases::text LIKE '%sao raimundo%'
    `;
    
    const saoRaimundoResult = await pool.query(saoRaimundoQuery);
    
    if (saoRaimundoResult.rows.length > 0) {
      console.log('⚠️ TIMES ENCONTRADOS com "sao raimundo":');
      saoRaimundoResult.rows.forEach(team => {
        console.log(`   - ID: ${team.id}, Nome: ${team.name}, Slug: ${team.slug}, Aliases: ${JSON.stringify(team.aliases)}`);
      });
    } else {
      console.log('✅ Nenhum time com "sao raimundo" encontrado na base');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar se existe São Paulo na base
    console.log('📋 Verificando times com "sao paulo" na base...');
    
    const saoPauloQuery = `
      SELECT id, name, short_name, slug, aliases 
      FROM teams 
      WHERE LOWER(name) LIKE '%sao paulo%' 
         OR LOWER(short_name) LIKE '%sao paulo%'
         OR LOWER(slug) LIKE '%sao paulo%'
         OR aliases::text LIKE '%sao paulo%'
    `;
    
    const saoPauloResult = await pool.query(saoPauloQuery);
    
    if (saoPauloResult.rows.length > 0) {
      console.log('✅ TIMES ENCONTRADOS com "sao paulo":');
      saoPauloResult.rows.forEach(team => {
        console.log(`   - ID: ${team.id}, Nome: ${team.name}, Slug: ${team.slug}, Aliases: ${JSON.stringify(team.aliases)}`);
      });
    } else {
      console.log('❌ Nenhum time com "sao paulo" encontrado na base');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar se existe Cruzeiro na base
    console.log('📋 Verificando times com "cruzeiro" na base...');
    
    const cruzeiroQuery = `
      SELECT id, name, short_name, slug, aliases 
      FROM teams 
      WHERE LOWER(name) LIKE '%cruzeiro%' 
         OR LOWER(short_name) LIKE '%cruzeiro%'
         OR LOWER(slug) LIKE '%cruzeiro%'
         OR aliases::text LIKE '%cruzeiro%'
    `;
    
    const cruzeiroResult = await pool.query(cruzeiroQuery);
    
    if (cruzeiroResult.rows.length > 0) {
      console.log('✅ TIMES ENCONTRADOS com "cruzeiro":');
      cruzeiroResult.rows.forEach(team => {
        console.log(`   - ID: ${team.id}, Nome: ${team.name}, Slug: ${team.slug}, Aliases: ${JSON.stringify(team.aliases)}`);
      });
    } else {
      console.log('❌ Nenhum time com "cruzeiro" encontrado na base');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Verificar se há conflitos de nomes similares
    console.log('🔍 Verificando possíveis conflitos de nomes...');
    
    const conflictQuery = `
      SELECT t1.id as id1, t1.name as name1, t1.aliases as aliases1,
             t2.id as id2, t2.name as name2, t2.aliases as aliases2
      FROM teams t1
      JOIN teams t2 ON t1.id < t2.id
      WHERE (
        LOWER(t1.name) LIKE '%sao%' AND LOWER(t2.name) LIKE '%sao%'
        AND t1.name != t2.name
      )
      OR (
        LOWER(t1.aliases::text) LIKE '%sao%' AND LOWER(t2.aliases::text) LIKE '%sao%'
        AND t1.id != t2.id
      )
    `;
    
    const conflictResult = await pool.query(conflictQuery);
    
    if (conflictResult.rows.length > 0) {
      console.log('⚠️ POSSÍVEIS CONFLITOS detectados:');
      conflictResult.rows.forEach(conflict => {
        console.log(`   - ${conflict.name1} (ID: ${conflict.id1}) vs ${conflict.name2} (ID: ${conflict.id2})`);
        console.log(`     Aliases 1: ${JSON.stringify(conflict.aliases1)}`);
        console.log(`     Aliases 2: ${JSON.stringify(conflict.aliases2)}`);
        console.log('');
      });
    } else {
      console.log('✅ Nenhum conflito de nomes similares detectado');
    }

  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error.message);
    
    // Fallback: mostrar estrutura da tabela
    console.log('\n📋 Estrutura da tabela teams:');
    try {
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'teams'
        ORDER BY ordinal_position
      `;
      
      const structureResult = await pool.query(structureQuery);
      structureResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (structureError) {
      console.log('❌ Não foi possível verificar estrutura da tabela');
    }
  } finally {
    await pool.end();
  }
}

// Executar verificação
checkSaoRaimundoConflict().catch(console.error);
