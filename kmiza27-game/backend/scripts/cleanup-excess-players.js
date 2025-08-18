const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function cleanupExcessPlayers() {
  console.log('🧹 LIMPEZA DE JOGADORES EXCEDENTES');
  console.log('===================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar situação atual
    console.log('📊 1. Verificando situação atual...');
    
    const { count: youthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    const { count: proCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de jogadores da base: ${youthCount || 0}`);
    console.log(`📊 Total de jogadores profissionais: ${proCount || 0}`);
    console.log(`📊 Total geral: ${(youthCount || 0) + (proCount || 0)}`);

    const MAX_PLAYERS = 100;
    const currentTotal = (youthCount || 0) + (proCount || 0);

    if (currentTotal <= MAX_PLAYERS) {
      console.log('✅ Sistema já está dentro do limite de 100 jogadores!');
      return;
    }

    const excessCount = currentTotal - MAX_PLAYERS;
    console.log(`🚨 Excesso de jogadores: ${excessCount}`);

    // 2. Estratégia: Manter apenas os melhores
    console.log('\n🎯 2. Estratégia: Manter apenas os melhores jogadores...');
    
    // Manter 70% jogadores da base (70) e 30% profissionais (30)
    const keepYouth = Math.floor(MAX_PLAYERS * 0.7); // 70
    const keepPro = MAX_PLAYERS - keepYouth; // 30

    console.log(`📋 Manter: ${keepYouth} jogadores da base + ${keepPro} profissionais = ${MAX_PLAYERS} total`);

    // 3. Selecionar os melhores jogadores da base
    console.log('\n👶 3. Selecionando melhores jogadores da base...');
    
    const { data: bestYouth, error: youthError } = await supabase
      .from('youth_players')
      .select('id')
      .order('potential', { ascending: false })
      .limit(keepYouth);

    if (youthError) {
      console.log('❌ Erro ao buscar jogadores da base:', youthError.message);
      return;
    }

    const youthIdsToKeep = bestYouth?.map(p => p.id) || [];
    console.log(`✅ ${youthIdsToKeep.length} melhores jogadores da base selecionados`);

    // 4. Selecionar os melhores jogadores profissionais
    console.log('\n👨‍💼 4. Selecionando melhores jogadores profissionais...');
    
    const { data: bestPro, error: proError } = await supabase
      .from('game_players')
      .select('id')
      .order('current_ability', { ascending: false })
      .limit(keepPro);

    if (proError) {
      console.log('❌ Erro ao buscar jogadores profissionais:', proError.message);
      return;
    }

    const proIdsToKeep = bestPro?.map(p => p.id) || [];
    console.log(`✅ ${proIdsToKeep.length} melhores jogadores profissionais selecionados`);

    // 5. Remover jogadores excedentes
    console.log('\n🗑️ 5. Removendo jogadores excedentes...');
    
    // Remover jogadores da base excedentes
    if (youthIdsToKeep.length > 0) {
      const { error: deleteYouthError } = await supabase
        .from('youth_players')
        .delete()
        .not('id', 'in', `(${youthIdsToKeep.join(',')})`);

      if (deleteYouthError) {
        console.log('❌ Erro ao remover jogadores da base excedentes:', deleteYouthError.message);
      } else {
        console.log('✅ Jogadores da base excedentes removidos');
      }
    }

    // Remover jogadores profissionais excedentes
    if (proIdsToKeep.length > 0) {
      const { error: deleteProError } = await supabase
        .from('game_players')
        .delete()
        .not('id', 'in', `(${proIdsToKeep.join(',')})`);

      if (deleteProError) {
        console.log('❌ Erro ao remover jogadores profissionais excedentes:', deleteProError.message);
      } else {
        console.log('✅ Jogadores profissionais excedentes removidos');
      }
    }

    // 6. Verificar resultado final
    console.log('\n📊 6. Verificando resultado final...');
    
    const { count: finalYouthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    const { count: finalProCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    const finalTotal = (finalYouthCount || 0) + (finalProCount || 0);

    console.log(`📊 Total final de jogadores da base: ${finalYouthCount || 0}`);
    console.log(`📊 Total final de jogadores profissionais: ${finalProCount || 0}`);
    console.log(`📊 Total geral: ${finalTotal}`);

    if (finalTotal <= MAX_PLAYERS) {
      console.log('✅ SUCESSO: Sistema limitado a 100 jogadores!');
    } else {
      console.log('⚠️ ATENÇÃO: Ainda há jogadores excedentes');
    }

    console.log('\n🎉 LIMPEZA CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • Antes: ${currentTotal} jogadores`);
    console.log(`   • Depois: ${finalTotal} jogadores`);
    console.log(`   • Redução: ${currentTotal - finalTotal} jogadores`);
    console.log(`   • Meta: ${MAX_PLAYERS} jogadores`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Testar IA do mercado com menos jogadores');
    console.log('   2. Verificar se o sistema está mais responsivo');
    console.log('   3. Monitorar performance');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

cleanupExcessPlayers();
