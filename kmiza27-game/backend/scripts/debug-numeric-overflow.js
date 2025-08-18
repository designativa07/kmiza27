const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function debugNumericOverflow() {
  console.log('🔍 DEBUGANDO OVERFLOW NUMÉRICO - IDENTIFICANDO CAMPO PROBLEMÁTICO');
  console.log('==================================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estrutura da tabela
    console.log('📋 1. Verificando estrutura da tabela game_players...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erro ao acessar tabela:', tableError.message);
      return;
    }

    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Tabela acessível');
      console.log('📊 Colunas disponíveis:', Object.keys(tableInfo[0]).length);
    } else {
      console.log('ℹ️ Tabela vazia, tentando inserção mínima...');
    }

    // 2. Testar inserção com campos mínimos
    console.log('\n🧪 2. Testando inserção mínima...');
    
    const minimalPlayer = {
      id: require('crypto').randomUUID(),
      team_id: '00000000-0000-0000-0000-000000000001', // ID fictício para teste
      name: 'Teste Overflow',
      age: 25,
      nationality: 'BRA',
      position: 'GK',
      potential: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Tentando inserir jogador com campos mínimos...');
    const { error: minimalError } = await supabase
      .from('game_players')
      .insert(minimalPlayer);

    if (minimalError) {
      console.log('❌ Erro na inserção mínima:', minimalError.message);
      
      // 3. Se falhar, tentar identificar o campo problemático
      if (minimalError.message.includes('numeric field overflow')) {
        console.log('\n🔍 3. Identificando campo com overflow...');
        
        // Testar cada campo numérico individualmente
        const numericFields = ['age', 'potential'];
        
        for (const field of numericFields) {
          console.log(`   🧪 Testando campo: ${field}`);
          
          const testData = { ...minimalPlayer };
          testData[field] = 1; // Valor mínimo
          
          const { error: fieldError } = await supabase
            .from('game_players')
            .insert(testData);
          
          if (fieldError) {
            console.log(`      ❌ ${field} = 1: ${fieldError.message}`);
          } else {
            console.log(`      ✅ ${field} = 1: OK`);
          }
        }
      }
    } else {
      console.log('✅ Inserção mínima bem-sucedida!');
    }

    // 4. Verificar constraints da tabela
    console.log('\n🔧 4. Verificando constraints...');
    
    try {
      const { data: constraints, error: constraintsError } = await supabase
        .rpc('get_table_constraints', { table_name: 'game_players' });
      
      if (constraintsError) {
        console.log('ℹ️ Não foi possível verificar constraints via RPC');
      } else {
        console.log('📋 Constraints encontradas:', constraints);
      }
    } catch (error) {
      console.log('ℹ️ RPC não disponível');
    }

    // 5. Tentar inserção com valores extremos
    console.log('\n🧪 5. Testando valores extremos...');
    
    const extremePlayer = {
      id: require('crypto').randomUUID(),
      team_id: '00000000-0000-0000-0000-000000000001',
      name: 'Teste Extremo',
      age: 1, // Valor mínimo
      nationality: 'BRA',
      position: 'GK',
      potential: 1, // Valor mínimo
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: extremeError } = await supabase
      .from('game_players')
      .insert(extremePlayer);

    if (extremeError) {
      console.log('❌ Erro com valores extremos:', extremeError.message);
    } else {
      console.log('✅ Valores extremos funcionaram!');
    }

    // 6. Verificar se há campos calculados/gerados
    console.log('\n🔍 6. Verificando campos calculados...');
    
    const { data: existingPlayer, error: existingError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (existingPlayer && existingPlayer.length > 0) {
      const player = existingPlayer[0];
      console.log('📊 Campos do jogador existente:');
      
      // Verificar campos que podem ser calculados
      const possibleCalculatedFields = ['current_ability', 'overall_rating', 'market_value'];
      
      possibleCalculatedFields.forEach(field => {
        if (player.hasOwnProperty(field)) {
          console.log(`   • ${field}: ${player[field]} (tipo: ${typeof player[field]})`);
        }
      });
    }

    // 7. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('   • O erro "numeric field overflow" indica um campo SMALLINT ou similar');
    console.log('   • Possíveis campos problemáticos: age, potential, salary, market_value');
    console.log('   • Verificar se há campos calculados que não podem ser inseridos');
    console.log('   • Verificar se há triggers ou constraints que modificam valores');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugNumericOverflow();
