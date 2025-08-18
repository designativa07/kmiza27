const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function fixPotentialConstraint() {
  console.log('🔧 VERIFICANDO E CORRIGINDO CONSTRAINT DO CAMPO POTENTIAL');
  console.log('==========================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar jogadores existentes e seus valores de potential
    console.log('📋 1. Verificando valores de potential existentes...');
    
    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select('id, name, potential, position')
      .order('potential');

    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }

    console.log(`📊 Total de jogadores: ${players?.length || 0}`);
    
    // Analisar valores de potential
    const potentialValues = players?.map(p => p.potential).filter(p => p !== null) || [];
    if (potentialValues.length > 0) {
      const minPotential = Math.min(...potentialValues);
      const maxPotential = Math.max(...potentialValues);
      const avgPotential = Math.round(potentialValues.reduce((a, b) => a + b, 0) / potentialValues.length);
      
      console.log(`📊 Valores de potential:`);
      console.log(`   • Mínimo: ${minPotential}`);
      console.log(`   • Máximo: ${maxPotential}`);
      console.log(`   • Média: ${avgPotential}`);
    }

    // 2. Verificar se há jogadores com potential inválido
    console.log('\n🔍 2. Verificando jogadores com potential inválido...');
    
    const invalidPlayers = players?.filter(p => {
      const potential = p.potential;
      return potential === null || potential === undefined || potential < 0 || potential > 100;
    }) || [];

    if (invalidPlayers.length > 0) {
      console.log(`⚠️  Jogadores com potential inválido: ${invalidPlayers.length}`);
      invalidPlayers.slice(0, 5).forEach(player => {
        console.log(`   • ${player.name} (${player.position}): potential = ${player.potential}`);
      });
    } else {
      console.log('✅ Todos os jogadores têm potential válido');
    }

    // 3. Tentar criar um jogador de teste para identificar a constraint exata
    console.log('\n🧪 3. Testando criação de jogador...');
    
    const testPlayer = {
      id: require('crypto').randomUUID(),
      team_id: '00000000-0000-0000-0000-000000000000', // ID fake para teste
      name: 'Teste Constraint',
      age: 25,
      nationality: 'BRA',
      position: 'GK',
      alternative_positions: [],
      team_type: 'machine',
      
      // Atributos básicos
      passing: 60,
      shooting: 55,
      dribbling: 55,
      crossing: 55,
      finishing: 50,
      speed: 60,
      stamina: 65,
      strength: 60,
      jumping: 60,
      concentration: 60,
      creativity: 55,
      vision: 60,
      leadership: 40,
      defending: 45,
      tackling: 45,
      heading: 50,
      goalkeeping: 75,
      
      // Testar diferentes valores de potential
      potential: 65, // Valor padrão que deveria funcionar
      development_rate: 50,
      
      // Status
      morale: 70,
      fitness: 100,
      form: 70,
      
      // Lesões
      injury_proneness: 15,
      injury_type: null,
      injury_severity: null,
      injury_return_date: null,
      
      // Contrato
      contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      salary_monthly: 15000,
      signing_bonus: 50000,
      release_clause: 500000,
      market_value: 200000,
      last_value_update: new Date().toISOString(),
      
      // Estatísticas
      games_played: 0,
      games_started: 0,
      minutes_played: 0,
      goals_scored: 0,
      assists: 0,
      shots_taken: 0,
      shots_on_target: 0,
      tackles_made: 0,
      interceptions: 0,
      clearances: 0,
      clean_sheets: 0,
      yellow_cards: 0,
      red_cards: 0,
      average_rating: 0,
      last_ratings: [],
      
      // Informações do jogador
      origin: 'academy',
      signed_date: new Date().toISOString(),
      previous_clubs: [],
      youth_academy_level: 1,
      promoted_from_youth: false,
      
      // Treinamento
      individual_training: false,
      training_start_date: null,
      training_end_date: null,
      training_progress: 0,
      training_points_week: 0,
      
      // Outros campos
      salary: 15000,
      is_in_academy: false,
      training_focus: 'balanced',
      training_intensity: 'medium',
      avatar_url: null,
      fatigue: 0,
      injury_until: null,
      traits: [],
      training_type: 'general',
      pace: 60,
      physical: 60,
      wage: 15000,
      contract_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_transfer_listed: false,
      asking_price: 0,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error: insertError } = await supabase
        .from('game_players')
        .insert(testPlayer);

      if (insertError) {
        console.log('❌ Erro na inserção de teste:', insertError.message);
        
        // Analisar o erro para entender a constraint
        if (insertError.message.includes('potential_check')) {
          console.log('\n🔍 ANÁLISE DA CONSTRAINT:');
          console.log('   • O campo potential tem uma constraint CHECK');
          console.log('   • Precisamos descobrir qual é o range válido');
          
          // Tentar com diferentes valores
          console.log('\n🧪 Testando diferentes valores de potential...');
          
          const testValues = [0, 1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
          
          for (const testValue of testValues) {
            const testData = { ...testPlayer, id: require('crypto').randomUUID(), potential: testValue };
            
            try {
              const { error: testError } = await supabase
                .from('game_players')
                .insert(testData);
              
              if (testError) {
                console.log(`   ❌ potential = ${testValue}: ${testError.message}`);
              } else {
                console.log(`   ✅ potential = ${testValue}: FUNCIONOU!`);
                // Remover o jogador de teste
                await supabase.from('game_players').delete().eq('id', testData.id);
                break;
              }
            } catch (error) {
              console.log(`   ❌ potential = ${testValue}: Erro geral`);
            }
          }
        }
      } else {
        console.log('✅ Jogador de teste criado com sucesso!');
        // Remover o jogador de teste
        await supabase.from('game_players').delete().eq('id', testPlayer.id);
        console.log('🗑️  Jogador de teste removido');
      }
    } catch (error) {
      console.log('❌ Erro geral na inserção:', error.message);
    }

    // 4. Verificar se há jogadores com potential muito baixo ou alto
    console.log('\n📊 4. Analisando distribuição de potential...');
    
    const lowPotential = players?.filter(p => p.potential < 30) || [];
    const highPotential = players?.filter(p => p.potential > 80) || [];
    
    console.log(`📊 Jogadores com potential < 30: ${lowPotential.length}`);
    console.log(`📊 Jogadores com potential > 80: ${highPotential.length}`);

    // 5. Resumo e recomendações
    console.log('\n💡 RESUMO E RECOMENDAÇÕES:');
    console.log('   • O campo potential tem uma constraint CHECK');
    console.log('   • Precisamos descobrir o range válido');
    console.log('   • Possíveis causas:');
    console.log('     - Range muito restritivo (ex: 50-70)');
    console.log('     - Valores específicos não permitidos');
    console.log('     - Constraint baseada em outros campos');
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('   1. Identificar o range válido da constraint');
    console.log('   2. Ajustar o sistema de criação automática');
    console.log('   3. Corrigir jogadores existentes se necessário');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixPotentialConstraint();
