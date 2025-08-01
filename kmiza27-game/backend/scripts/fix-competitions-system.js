const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixCompetitionsSystem() {
  try {
    console.log('🔧 Corrigindo sistema de competições...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. Limpar competições duplicadas
    console.log('\n🗑️ Limpando competições duplicadas...');
    
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier');
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log(`📋 Competições encontradas: ${competitions.length}`);
    
    // Agrupar por nome e tier para identificar duplicatas
    const grouped = {};
    competitions.forEach(comp => {
      const key = `${comp.name}-${comp.tier}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(comp);
    });
    
    // Deletar duplicatas (manter apenas a primeira)
    for (const [key, comps] of Object.entries(grouped)) {
      if (comps.length > 1) {
        console.log(`🗑️ Removendo ${comps.length - 1} duplicatas de ${key}`);
        
        // Manter a primeira, deletar as outras
        const toDelete = comps.slice(1);
        for (const comp of toDelete) {
          const { error: deleteError } = await supabase
            .from('game_competitions')
            .delete()
            .eq('id', comp.id);
          
          if (deleteError) {
            console.error(`❌ Erro ao deletar competição ${comp.id}:`, deleteError);
          } else {
            console.log(`✅ Competição ${comp.name} (${comp.id}) removida`);
          }
        }
      }
    }
    
    // 2. Atualizar season_year para competições que estão null
    console.log('\n📅 Atualizando season_year...');
    
    const { data: nullSeasonComps, error: nullError } = await supabase
      .from('game_competitions')
      .select('id, name')
      .is('season_year', null);
    
    if (nullSeasonComps && nullSeasonComps.length > 0) {
      console.log(`📝 Atualizando ${nullSeasonComps.length} competições sem season_year`);
      
      for (const comp of nullSeasonComps) {
        const { error: updateError } = await supabase
          .from('game_competitions')
          .update({ season_year: 2024 })
          .eq('id', comp.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar ${comp.name}:`, updateError);
        } else {
          console.log(`✅ ${comp.name} atualizada com season_year = 2024`);
        }
      }
    }
    
    // 3. Verificar competições finais
    console.log('\n🏆 Verificando competições finais...');
    
    const { data: finalComps, error: finalError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier');
    
    if (finalError) {
      console.error('❌ Erro ao buscar competições finais:', finalError);
    } else {
      console.log(`✅ Competições finais: ${finalComps.length}`);
      finalComps.forEach(comp => {
        console.log(`  - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times (${comp.season_year})`);
      });
    }
    
    // 4. Verificar se as tabelas necessárias existem
    console.log('\n📋 Verificando tabelas...');
    
    const tables = ['game_competition_teams', 'game_standings', 'game_rounds', 'game_competition_matches'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
        console.log(`💡 Execute o script SQL para criar a tabela ${table}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    }
    
    console.log('\n🎉 Correção do sistema de competições concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o script SQL no Supabase Dashboard');
    console.log('2. Execute: node scripts/test-competitions-system.js');
    console.log('3. Teste as funcionalidades no frontend');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

// Executar correção
fixCompetitionsSystem(); 