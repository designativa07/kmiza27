const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function fixPromotedUserStats() {
  try {
    // Usuário promovido para Série C
    const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';
    const tier = 3; // Série C
    const seasonYear = 2026;
    
    console.log('🔧 CORRIGINDO ESTATÍSTICAS DO USUÁRIO PROMOVIDO');
    console.log('======================================================================\n');
    console.log(`👤 Usuário: ${userId}`);
    console.log(`🏆 Série: C (${tier})`);
    console.log(`📅 Temporada: ${seasonYear}`);
    
    // 1. Buscar times da máquina da Série C
    console.log('\n📋 Passo 1: Buscando times da máquina da Série C...');
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('id, name')
      .eq('tier', tier)
      .eq('is_active', true);
    
    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }
    
    if (!machineTeams || machineTeams.length === 0) {
      console.log('❌ Nenhum time da máquina encontrado para Série C');
      return;
    }
    
    console.log(`✅ Encontrados ${machineTeams.length} times da máquina da Série C`);
    
    // 2. Criar estatísticas zeradas para cada time da máquina
    console.log('\n📋 Passo 2: Criando estatísticas zeradas...');
    let created = 0;
    let existing = 0;
    let errors = 0;
    
    for (const team of machineTeams) {
      try {
        const { data, error: insertError } = await supabase
          .from('game_user_machine_team_stats')
          .insert({
            user_id: userId,
            team_id: team.id,
            season_year: seasonYear,
            tier: tier,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          })
          .select();
        
        if (insertError) {
          if (insertError.code === '23505') {
            // Registro já existe
            existing++;
            console.log(`   ⚠️ ${team.name} - estatísticas já existem`);
          } else {
            errors++;
            console.log(`   ❌ ${team.name} - erro:`, insertError.message);
          }
        } else {
          created++;
          console.log(`   ✅ ${team.name} - estatísticas zeradas criadas`);
        }
      } catch (error) {
        errors++;
        console.log(`   ❌ ${team.name} - erro:`, error.message);
      }
    }
    
    // 3. Resultado final
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`   - Estatísticas criadas: ${created}`);
    console.log(`   - Já existiam: ${existing}`);
    console.log(`   - Erros: ${errors}`);
    console.log(`   - Total de times: ${machineTeams.length}`);
    
    if (created > 0) {
      console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
      console.log('💡 Agora o usuário promovido tem estatísticas dos times da máquina da Série C');
    } else if (existing > 0) {
      console.log('\n✅ ESTATÍSTICAS JÁ EXISTEM!');
      console.log('💡 O usuário promovido já tem as estatísticas corretas');
    } else {
      console.log('\n⚠️ NENHUMA ESTATÍSTICA FOI CRIADA');
      console.log('💡 Verifique se há erros no processo');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

fixPromotedUserStats(); 