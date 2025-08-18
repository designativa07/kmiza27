const { getSupabaseClient } = require('../config/supabase-connection');

/**
 * 🔍 VERIFICAÇÃO DO STATUS DO MERCADO
 * 
 * Objetivos:
 * 1. Verificar estado atual do mercado
 * 2. Identificar onde estão os jogadores
 * 3. Contar diferentes tipos de listagens
 */

async function checkMarketStatus() {
  try {
    console.log('🔍 VERIFICAÇÃO DO STATUS DO MERCADO');
    console.log('=' .repeat(50));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR TODAS AS LISTAGENS
    console.log('\n📊 1. Verificando todas as listagens...');
    const { data: allListings, error: allError } = await supabase
      .from('game_transfers')
      .select('*');

    if (allError) {
      console.error('❌ Erro ao buscar todas as listagens:', allError);
      return;
    }

    console.log(`📋 Total de registros na tabela game_transfers: ${allListings?.length || 0}`);

    if (allListings && allListings.length > 0) {
      // Agrupar por status
      const byStatus = {};
      allListings.forEach(listing => {
        const status = listing.transfer_status || 'sem_status';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      console.log('\n📊 Distribuição por status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`);
      });
    }

    // 2. VERIFICAR JOGADORES COM STATUS DE MERCADO
    console.log('\n👥 2. Verificando jogadores com status de mercado...');
    
    // Jogadores da base
    const { data: youthWithMarketStatus, error: youthError } = await supabase
      .from('youth_players')
      .select('id, name, market_status')
      .not('market_status', 'eq', 'none');

    if (youthError) {
      console.error('❌ Erro ao buscar jogadores da base:', youthError);
    } else {
      console.log(`📋 Jogadores da base com status de mercado: ${youthWithMarketStatus?.length || 0}`);
      if (youthWithMarketStatus && youthWithMarketStatus.length > 0) {
        const byStatus = {};
        youthWithMarketStatus.forEach(player => {
          const status = player.market_status || 'sem_status';
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
        
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`   • ${status}: ${count}`);
        });
      }
    }

    // Jogadores profissionais
    const { data: proWithMarketStatus, error: proError } = await supabase
      .from('game_players')
      .select('id, name, market_status')
      .not('market_status', 'eq', 'none');

    if (proError) {
      console.error('❌ Erro ao buscar jogadores profissionais:', proError);
    } else {
      console.log(`📋 Jogadores profissionais com status de mercado: ${proWithMarketStatus?.length || 0}`);
      if (proWithMarketStatus && proWithMarketStatus.length > 0) {
        const byStatus = {};
        proWithMarketStatus.forEach(player => {
          const status = player.market_status || 'sem_status';
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
        
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`   • ${status}: ${count}`);
        });
      }
    }

    // 3. VERIFICAR TIMES DA IA
    console.log('\n🤖 3. Verificando times da IA...');
    const { data: aiTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, is_user_team')
      .eq('is_user_team', false);

    if (teamsError) {
      console.error('❌ Erro ao buscar times da IA:', teamsError);
    } else {
      console.log(`📋 Times da IA encontrados: ${aiTeams?.length || 0}`);
      if (aiTeams && aiTeams.length > 0) {
        aiTeams.slice(0, 5).forEach(team => {
          console.log(`   • ${team.name} (${team.id})`);
        });
        if (aiTeams.length > 5) {
          console.log(`   ... e mais ${aiTeams.length - 5} times`);
        }
      }
    }

    // 4. VERIFICAR JOGADORES POR TIME
    console.log('\n👥 4. Verificando jogadores por time...');
    if (aiTeams && aiTeams.length > 0) {
      const sampleTeam = aiTeams[0];
      console.log(`📋 Verificando time: ${sampleTeam.name}`);
      
      // Jogadores da base
      const { data: youthPlayers, error: youthCountError } = await supabase
        .from('youth_players')
        .select('id')
        .eq('team_id', sampleTeam.id);

      if (youthCountError) {
        console.error('❌ Erro ao contar jogadores da base:', youthCountError);
      } else {
        console.log(`   • Jogadores da base: ${youthPlayers?.length || 0}`);
      }

      // Jogadores profissionais
      const { data: proPlayers, error: proCountError } = await supabase
        .from('game_players')
        .select('id')
        .eq('team_id', sampleTeam.id);

      if (proCountError) {
        console.error('❌ Erro ao contar jogadores profissionais:', proCountError);
      } else {
        console.log(`   • Jogadores profissionais: ${proPlayers?.length || 0}`);
      }
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
checkMarketStatus().then(() => {
  console.log('\n🔌 Script concluído.');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
