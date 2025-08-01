const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔧 CORRIGINDO CONTADORES DAS COMPETIÇÕES');
console.log('=' .repeat(45));

async function fixCompetitionCounters() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar todas as competições
    console.log('\n📋 1. Buscando competições...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, min_teams');
    
    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }
    
    console.log(`📊 Competições encontradas: ${competitions.length}`);
    
    // Para cada competição, contar quantos times estão realmente inscritos
    for (const competition of competitions) {
      console.log(`\n📋 2. Verificando ${competition.name}...`);
      console.log(`📊 Contador atual: ${competition.current_teams}/${competition.max_teams}`);
      
      // Contar times realmente inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select('id, team_id')
        .eq('competition_id', competition.id);
      
      if (teamsError) {
        console.log(`❌ Erro ao buscar times inscritos: ${teamsError.message}`);
        continue;
      }
      
      const actualCount = enrolledTeams ? enrolledTeams.length : 0;
      console.log(`📊 Times realmente inscritos: ${actualCount}`);
      
      // Se o contador estiver incorreto, corrigir
      if (actualCount !== competition.current_teams) {
        console.log(`⚠️  Contador incorreto! Atualizando de ${competition.current_teams} para ${actualCount}...`);
        
        const { error: updateError } = await supabase
          .from('game_competitions')
          .update({ current_teams: actualCount })
          .eq('id', competition.id);
        
        if (updateError) {
          console.log(`❌ Erro ao atualizar contador: ${updateError.message}`);
        } else {
          console.log(`✅ Contador corrigido para ${actualCount}`);
        }
      } else {
        console.log(`✅ Contador já está correto`);
      }
    }
    
    // Verificar resultado final
    console.log('\n📋 3. Verificando resultado final...');
    const { data: finalCompetitions, error: finalError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, min_teams');
    
    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
      return;
    }
    
    console.log('📊 Status final das competições:');
    finalCompetitions.forEach(comp => {
      console.log(`  - ${comp.name} (Série ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    console.log('\n✅ Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

// Executar correção
if (require.main === module) {
  fixCompetitionCounters();
}

module.exports = {
  fixCompetitionCounters
}; 