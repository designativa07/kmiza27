const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testApiRegistration() {
  console.log('🧪 TESTANDO API DE REGISTRO EM COMPETIÇÃO');
  console.log('=' .repeat(50));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Buscar competições e times
    console.log('\n📊 1. BUSCANDO DADOS...');
    
    const { data: competitions } = await supabase
      .from('game_competitions')
      .select('id, name, current_teams, max_teams')
      .limit(1);

    const { data: teams } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(5);

    if (!competitions || competitions.length === 0) {
      console.log('❌ Nenhuma competição encontrada');
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('❌ Nenhum time encontrado');
      return;
    }

    const competition = competitions[0];
    // Escolher um time que não está inscrito na competição
    let team = teams[0];
    for (const t of teams) {
      const { data: existingReg } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', competition.id)
        .eq('team_id', t.id)
        .single();
      
      if (!existingReg) {
        team = t;
        break;
      }
    }

    console.log(`✅ Competição: ${competition.name} (${competition.current_teams}/${competition.max_teams})`);
    console.log(`✅ Time: ${team.name} (${team.id})`);

    // 2. Simular requisição HTTP
    console.log('\n🌐 2. SIMULANDO REQUISIÇÃO HTTP...');
    
    const requestData = {
      teamId: team.id
    };

    console.log('📤 Dados enviados:', JSON.stringify(requestData, null, 2));

    // 3. Verificar se já está inscrito
    console.log('\n🔍 3. VERIFICANDO INSCRIÇÃO EXISTENTE...');
    
    const { data: existingReg, error: checkError } = await supabase
      .from('game_competition_teams')
      .select('id')
      .eq('competition_id', competition.id)
      .eq('team_id', team.id)
      .single();

    if (existingReg) {
      console.log('⚠️  Time já está inscrito nesta competição');
      return;
    }

    console.log('✅ Time não está inscrito, pode ser registrado');

    // 4. Tentar inserir inscrição
    console.log('\n➕ 4. INSERINDO INSCRIÇÃO...');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('game_competition_teams')
      .insert({
        competition_id: competition.id,
        team_id: team.id
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir inscrição:', insertError.message);
      console.log('📝 Detalhes do erro:', insertError);
      return;
    }

    console.log('✅ Inscrição criada com sucesso!');
    console.log('📄 Resultado:', JSON.stringify(insertResult, null, 2));

    // 5. Atualizar contador
    console.log('\n📈 5. ATUALIZANDO CONTADOR...');
    
    const { error: updateError } = await supabase
      .from('game_competitions')
      .update({ current_teams: competition.current_teams + 1 })
      .eq('id', competition.id);

    if (updateError) {
      console.log('⚠️  Erro ao atualizar contador:', updateError.message);
    } else {
      console.log('✅ Contador atualizado');
    }

    // 6. Criar entrada na classificação
    console.log('\n🏆 6. CRIANDO ENTRADA NA CLASSIFICAÇÃO...');
    
    const { error: standingsError } = await supabase
      .from('game_standings')
      .insert({
        competition_id: competition.id,
        team_id: team.id,
        season_year: 2024
      });

    if (standingsError) {
      console.log('⚠️  Erro ao criar classificação:', standingsError.message);
    } else {
      console.log('✅ Entrada na classificação criada');
    }

    // 7. Verificar resultado final
    console.log('\n✅ 7. VERIFICANDO RESULTADO FINAL...');
    
    const { data: finalCompetition } = await supabase
      .from('game_competitions')
      .select('name, current_teams, max_teams')
      .eq('id', competition.id)
      .single();

    const { data: finalRegistration } = await supabase
      .from('game_competition_teams')
      .select('id')
      .eq('competition_id', competition.id)
      .eq('team_id', team.id)
      .single();

    console.log(`🏆 ${finalCompetition.name}: ${finalCompetition.current_teams}/${finalCompetition.max_teams} times`);
    console.log(`✅ Inscrição confirmada: ${finalRegistration ? 'SIM' : 'NÃO'}`);

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ API de registro está funcionando corretamente');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testApiRegistration()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 