const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function resetCompetitionsForTest() {
  console.log('🔄 RESETANDO COMPETIÇÕES PARA TESTE');
  console.log('=' .repeat(50));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Limpar inscrições existentes
    console.log('\n🗑️  1. LIMPANDO INSCRIÇÕES EXISTENTES...');
    
    const { error: deleteRegistrationsError } = await supabase
      .from('game_competition_teams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (deleteRegistrationsError) {
      console.log('❌ Erro ao limpar inscrições:', deleteRegistrationsError.message);
    } else {
      console.log('✅ Inscrições limpas com sucesso');
    }

    // 2. Limpar classificações
    console.log('\n📊 2. LIMPANDO CLASSIFICAÇÕES...');
    
    const { error: deleteStandingsError } = await supabase
      .from('game_standings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (deleteStandingsError) {
      console.log('❌ Erro ao limpar classificações:', deleteStandingsError.message);
    } else {
      console.log('✅ Classificações limpas com sucesso');
    }

    // 3. Resetar contadores das competições
    console.log('\n🔄 3. RESETANDO CONTADORES DAS COMPETIÇÕES...');
    
    const { data: competitions } = await supabase
      .from('game_competitions')
      .select('id, name');

    for (const competition of competitions) {
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: 0 })
        .eq('id', competition.id);

      if (updateError) {
        console.log(`❌ Erro ao resetar ${competition.name}: ${updateError.message}`);
      } else {
        console.log(`✅ ${competition.name} resetada para 0 times`);
      }
    }

    // 4. Verificar estado final
    console.log('\n📊 4. VERIFICANDO ESTADO FINAL...');
    
    const { data: finalCompetitions } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    console.log('✅ Estado final das competições:');
    finalCompetitions?.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });

    // 5. Verificar inscrições
    console.log('\n🏆 5. VERIFICANDO INSCRIÇÕES...');
    
    const { data: registrations } = await supabase
      .from('game_competition_teams')
      .select('*');

    console.log(`✅ ${registrations?.length || 0} inscrições restantes`);

    // 6. Verificar classificações
    console.log('\n📈 6. VERIFICANDO CLASSIFICAÇÕES...');
    
    const { data: standings } = await supabase
      .from('game_standings')
      .select('*');

    console.log(`✅ ${standings?.length || 0} entradas na classificação restantes`);

    console.log('\n🎉 RESET CONCLUÍDO COM SUCESSO!');
    console.log('🚀 Competições prontas para teste de auto-população');

  } catch (error) {
    console.error('❌ Erro no reset:', error.message);
  }
}

// Executar reset
resetCompetitionsForTest()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 