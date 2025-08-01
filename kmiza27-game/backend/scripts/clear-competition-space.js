const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🧹 LIMPANDO ESPAÇO NAS COMPETIÇÕES');
console.log('=' .repeat(40));

async function clearCompetitionSpace() {
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
    
    // Para cada competição, remover alguns times da máquina para deixar espaço
    for (const competition of competitions) {
      console.log(`\n📋 2. Processando ${competition.name}...`);
      console.log(`📊 Status atual: ${competition.current_teams}/${competition.max_teams}`);
      
      // Se a competição está cheia, remover alguns times da máquina
      if (competition.current_teams >= competition.max_teams) {
        const excessTeams = competition.current_teams - competition.max_teams + 5; // Deixar 5 vagas
        console.log(`📊 Removendo ${excessTeams} times para deixar espaço...`);
        
        // Buscar times da máquina inscritos nesta competição
        const { data: machineTeams, error: teamsError } = await supabase
          .from('game_competition_teams')
          .select(`
            id,
            team_id,
            game_teams!inner(name, team_type)
          `)
          .eq('competition_id', competition.id)
          .eq('game_teams.team_type', 'machine')
          .limit(excessTeams);
        
        if (teamsError) {
          console.log(`❌ Erro ao buscar times da máquina: ${teamsError.message}`);
          continue;
        }
        
        if (machineTeams && machineTeams.length > 0) {
          console.log(`📊 Encontrados ${machineTeams.length} times da máquina para remover`);
          
          // Remover times da máquina
          for (const team of machineTeams) {
            const { error: deleteError } = await supabase
              .from('game_competition_teams')
              .delete()
              .eq('id', team.id);
            
            if (deleteError) {
              console.log(`❌ Erro ao remover time ${team.team_id}: ${deleteError.message}`);
            } else {
              console.log(`✅ Time ${team.game_teams.name} removido`);
            }
          }
        } else {
          console.log(`📊 Nenhum time da máquina encontrado para remover`);
        }
      } else {
        console.log(`✅ Competição já tem espaço disponível`);
      }
    }
    
    // Atualizar contadores
    console.log('\n📋 3. Atualizando contadores...');
    for (const competition of competitions) {
      const { data: enrolledTeams, error: countError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', competition.id);
      
      if (countError) {
        console.log(`❌ Erro ao contar times: ${countError.message}`);
        continue;
      }
      
      const actualCount = enrolledTeams ? enrolledTeams.length : 0;
      
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: actualCount })
        .eq('id', competition.id);
      
      if (updateError) {
        console.log(`❌ Erro ao atualizar contador: ${updateError.message}`);
      } else {
        console.log(`✅ ${competition.name}: ${actualCount}/${competition.max_teams}`);
      }
    }
    
    // Verificar resultado final
    console.log('\n📋 4. Verificando resultado final...');
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
    
    console.log('\n✅ Limpeza concluída!');
    console.log('💡 Agora há espaço para novos times se inscreverem');
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

// Executar limpeza
if (require.main === module) {
  clearCompetitionSpace();
}

module.exports = {
  clearCompetitionSpace
}; 