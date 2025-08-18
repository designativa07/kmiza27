const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function testUltraMinimal() {
  console.log('🧪 TESTE ULTRA MÍNIMO - IDENTIFICANDO CAMPO PROBLEMÁTICO');
  console.log('==========================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar se há algum time válido para usar
    console.log('📋 1. Verificando times disponíveis...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(1);

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('❌ Nenhum time encontrado');
      return;
    }

    const teamId = teams[0].id;
    console.log(`✅ Usando time: ${teams[0].name} (${teamId})`);

    // 2. Testar inserção com campos ABSOLUTAMENTE mínimos
    console.log('\n🧪 2. Testando inserção ultra mínima...');
    
    const ultraMinimalPlayer = {
      id: require('crypto').randomUUID(),
      team_id: teamId,
      name: 'Teste Ultra Mínimo',
      age: 25,
      nationality: 'BRA',
      position: 'GK',
      goalkeeping: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Tentando inserir com campos ultra mínimos...');
    console.log('📋 Campos:', Object.keys(ultraMinimalPlayer));
    
    const { error: ultraMinimalError } = await supabase
      .from('game_players')
      .insert(ultraMinimalPlayer);

    if (ultraMinimalError) {
      console.log('❌ Erro na inserção ultra mínima:', ultraMinimalError.message);
      
      // 3. Se falhar, tentar identificar o campo problemático
      if (ultraMinimalError.message.includes('numeric field overflow')) {
        console.log('\n🔍 3. Identificando campo com overflow...');
        
        // Testar cada campo individualmente
        const testFields = ['id', 'team_id', 'name', 'age', 'nationality', 'position', 'goalkeeping', 'created_at', 'updated_at'];
        
        for (const field of testFields) {
          console.log(`   🧪 Testando campo: ${field}`);
          
          const testData = { ...ultraMinimalPlayer };
          delete testData[field];
          
          const { error: fieldError } = await supabase
            .from('game_players')
            .insert(testData);
          
          if (fieldError) {
            console.log(`      ❌ Sem ${field}: ${fieldError.message}`);
          } else {
            console.log(`      ✅ Sem ${field}: OK`);
          }
        }
      }
    } else {
      console.log('✅ Inserção ultra mínima bem-sucedida!');
    }

    // 4. Verificar se há campos com valores padrão que podem estar causando overflow
    console.log('\n🔍 4. Verificando campos com valores padrão...');
    
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'game_players' });
      
      if (tableError) {
        console.log('ℹ️ Não foi possível verificar estrutura via RPC');
      } else {
        console.log('📋 Informações da tabela:', tableInfo);
      }
    } catch (error) {
      console.log('ℹ️ RPC não disponível');
    }

    // 5. Tentar inserção com valores extremos para campos numéricos
    console.log('\n🧪 5. Testando valores extremos...');
    
    const extremePlayer = {
      id: require('crypto').randomUUID(),
      team_id: teamId,
      name: 'Teste Extremo',
      age: 1,
      nationality: 'BRA',
      position: 'GK',
      goalkeeping: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Tentando inserir com valores extremos...');
    const { error: extremeError } = await supabase
      .from('game_players')
      .insert(extremePlayer);

    if (extremeError) {
      console.log('❌ Erro com valores extremos:', extremeError.message);
      
      // Se for overflow, tentar identificar o campo
      if (extremeError.message.includes('numeric field overflow')) {
        console.log('\n🔍 6. Identificando campo numérico problemático...');
        
        // Testar cada campo numérico individualmente
        const numericFields = ['age', 'goalkeeping'];
        
        for (const field of numericFields) {
          console.log(`   🧪 Testando campo numérico: ${field}`);
          
          const testData = { ...extremePlayer };
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
      console.log('✅ Valores extremos funcionaram!');
    }

    // 7. Verificar se há triggers ou constraints automáticas
    console.log('\n🔍 7. Verificando triggers/constraints automáticas...');
    
    const { data: existingPlayer, error: existingError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (existingPlayer && existingPlayer.length > 0) {
      const player = existingPlayer[0];
      console.log('📊 Campos do jogador existente:');
      
      // Verificar campos que podem ser calculados automaticamente
      const possibleAutoFields = ['current_ability', 'overall_rating', 'market_value', 'salary'];
      
      possibleAutoFields.forEach(field => {
        if (player.hasOwnProperty(field)) {
          console.log(`   • ${field}: ${player[field]} (tipo: ${typeof player[field]})`);
        }
      });
    }

    // 8. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('   • O erro "numeric field overflow" indica um campo SMALLINT ou similar');
    console.log('   • Pode ser um campo com valor padrão que está sendo calculado automaticamente');
    console.log('   • Verificar se há triggers que modificam valores durante inserção');
    console.log('   • Verificar se há campos calculados que não podem ser inseridos');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testUltraMinimal();
