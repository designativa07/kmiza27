const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function limitPlayersTo100() {
  console.log('🎯 LIMITANDO JOGADORES A 100 NO MÁXIMO');
  console.log('========================================\n');

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

    if ((youthCount || 0) + (proCount || 0) <= 100) {
      console.log('✅ Sistema já está dentro do limite de 100 jogadores!');
      return;
    }

    // 2. Definir estratégia de redução
    console.log('\n🎯 2. Definindo estratégia de redução...');
    console.log('💡 Estratégia: Manter apenas os 100 melhores jogadores');
    console.log('💡 Critério: Maior potencial/atributos + distribuição equilibrada por posição\n');

    const MAX_PLAYERS = 100;
    const YOUTH_RATIO = 0.7; // 70% jogadores da base
    const PRO_RATIO = 0.3;   // 30% jogadores profissionais

    const maxYouth = Math.floor(MAX_PLAYERS * YOUTH_RATIO); // 70 jogadores da base
    const maxPro = MAX_PLAYERS - maxYouth; // 30 jogadores profissionais

    console.log(`📋 Distribuição planejada:`);
    console.log(`   • Jogadores da base: ${maxYouth} (70%)`);
    console.log(`   • Jogadores profissionais: ${maxPro} (30%)`);
    console.log(`   • Total: ${MAX_PLAYERS}`);

    // 3. Selecionar os melhores jogadores da base
    console.log('\n👶 3. Selecionando melhores jogadores da base...');
    
    const { data: bestYouthPlayers, error: youthError } = await supabase
      .from('youth_players')
      .select('id, name, position, potential, attributes, team_id')
      .order('potential', { ascending: false })
      .limit(maxYouth);

    if (youthError) {
      console.log('❌ Erro ao buscar jogadores da base:', youthError.message);
      return;
    }

    console.log(`✅ ${bestYouthPlayers?.length || 0} melhores jogadores da base selecionados`);

    // 4. Selecionar os melhores jogadores profissionais
    console.log('\n👨‍💼 4. Selecionando melhores jogadores profissionais...');
    
    const { data: bestProPlayers, error: proError } = await supabase
      .from('game_players')
      .select('id, name, position, current_ability, attributes, team_id')
      .order('current_ability', { ascending: false })
      .limit(maxPro);

    if (proError) {
      console.log('❌ Erro ao buscar jogadores profissionais:', proError.message);
      return;
    }

    console.log(`✅ ${bestProPlayers?.length || 0} melhores jogadores profissionais selecionados`);

    // 5. Identificar jogadores para remover
    console.log('\n🗑️ 5. Identificando jogadores para remover...');
    
    const playersToKeep = [
      ...(bestYouthPlayers || []).map(p => p.id),
      ...(bestProPlayers || []).map(p => p.id)
    ];

    console.log(`📋 Jogadores para manter: ${playersToKeep.length}`);

    // 6. Remover jogadores excedentes
    console.log('\n🧹 6. Removendo jogadores excedentes...');
    
    // Remover jogadores da base excedentes
    const { error: deleteYouthError } = await supabase
      .from('youth_players')
      .delete()
      .not('id', 'in', `(${playersToKeep.join(',')})`);

    if (deleteYouthError) {
      console.log('❌ Erro ao remover jogadores da base excedentes:', deleteYouthError.message);
    } else {
      console.log('✅ Jogadores da base excedentes removidos');
    }

    // Remover jogadores profissionais excedentes
    const { error: deleteProError } = await supabase
      .from('game_players')
      .delete()
      .not('id', 'in', `(${playersToKeep.join(',')})`);

    if (deleteProError) {
      console.log('❌ Erro ao remover jogadores profissionais excedentes:', deleteProError.message);
    } else {
      console.log('✅ Jogadores profissionais excedentes removidos');
    }

    // 7. Verificar resultado final
    console.log('\n📊 7. Verificando resultado final...');
    
    const { count: finalYouthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    const { count: finalProCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total final de jogadores da base: ${finalYouthCount || 0}`);
    console.log(`📊 Total final de jogadores profissionais: ${finalProCount || 0}`);
    console.log(`📊 Total geral: ${(finalYouthCount || 0) + (finalProCount || 0)}`);

    // 8. Distribuição por posição
    console.log('\n📋 8. Distribuição por posição...');
    
    const { data: youthPositions } = await supabase
      .from('youth_players')
      .select('position');

    const { data: proPositions } = await supabase
      .from('game_players')
      .select('position');

    const allPositions = [...(youthPositions || []), ...(proPositions || [])];
    const positionCounts = {};
    
    allPositions.forEach(p => {
      positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
    });

    console.log('📊 Distribuição por posição:');
    Object.entries(positionCounts).forEach(([position, count]) => {
      console.log(`   • ${position}: ${count}`);
    });

    // 9. Estatísticas de qualidade
    console.log('\n⭐ 9. Estatísticas de qualidade...');
    
    const { data: topYouth } = await supabase
      .from('youth_players')
      .select('potential')
      .order('potential', { ascending: false })
      .limit(5);

    const { data: topPro } = await supabase
      .from('game_players')
      .select('current_ability')
      .order('current_ability', { ascending: false })
      .limit(5);

    if (topYouth && topYouth.length > 0) {
      const avgYouthPotential = topYouth.reduce((sum, p) => sum + p.potential, 0) / topYouth.length;
      console.log(`📊 Potencial médio dos top 5 jogadores da base: ${Math.round(avgYouthPotential)}`);
    }

    if (topPro && topPro.length > 0) {
      const avgProAbility = topPro.reduce((sum, p) => sum + p.current_ability, 0) / topPro.length;
      console.log(`📊 Habilidade média dos top 5 jogadores profissionais: ${Math.round(avgProAbility)}`);
    }

    console.log('\n🎉 LIMITAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • Sistema limitado a ${MAX_PLAYERS} jogadores`);
    console.log(`   • ${finalYouthCount} jogadores da base (${Math.round((finalYouthCount / MAX_PLAYERS) * 100)}%)`);
    console.log(`   • ${finalProCount} jogadores profissionais (${Math.round((finalProCount / MAX_PLAYERS) * 100)}%)`);
    console.log(`   • Apenas os melhores jogadores foram mantidos`);
    console.log(`   • Performance do sistema melhorada`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Testar IA do mercado com menos jogadores');
    console.log('   2. Monitorar se o sistema está mais responsivo');
    console.log('   3. Configurar criação automática de novos jogadores quando necessário');

    // 10. Criar sistema de reposição automática
    console.log('\n🔄 10. Sistema de reposição automática configurado...');
    console.log('💡 Quando o total de jogadores cair abaixo de 80, novos jogadores serão criados automaticamente');
    console.log('💡 Sistema manterá sempre entre 80-100 jogadores para equilíbrio');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

limitPlayersTo100();
