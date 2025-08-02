const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSerieDCapacity() {
  try {
    console.log('🔧 Corrigindo capacidade da Série D...');
    
    // 1. Verificar times inscritos na Série D
    const serieDId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319';
    
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type)
      `)
      .eq('competition_id', serieDId);
    
    if (teamsError) {
      console.error('❌ Erro ao buscar times inscritos:', teamsError);
      return;
    }
    
    console.log(`📊 Times inscritos na Série D: ${enrolledTeams.length}`);
    
    // 2. Separar times da máquina dos times de usuário
    const machineTeams = enrolledTeams.filter(team => team.game_teams.team_type === 'machine');
    const userTeams = enrolledTeams.filter(team => team.game_teams.team_type === 'user_created');
    
    console.log(`🤖 Times da máquina: ${machineTeams.length}`);
    console.log(`👤 Times de usuário: ${userTeams.length}`);
    
    // 3. Se há muitos times da máquina, remover alguns para liberar espaço
    if (machineTeams.length > 10) {
      const teamsToRemove = machineTeams.slice(0, 5); // Remover 5 times da máquina
      
      console.log(`🗑️ Removendo ${teamsToRemove.length} times da máquina para liberar espaço:`);
      
      for (const team of teamsToRemove) {
        console.log(`  - ${team.game_teams.name} (${team.game_teams.team_type})`);
        
        // Remover da competição
        const { error: deleteError } = await supabase
          .from('game_competition_teams')
          .delete()
          .eq('competition_id', serieDId)
          .eq('team_id', team.team_id);
        
        if (deleteError) {
          console.error(`    ❌ Erro ao remover ${team.game_teams.name}:`, deleteError);
        } else {
          console.log(`    ✅ ${team.game_teams.name} removido`);
        }
      }
      
      // 4. Atualizar contador da competição
      const newCount = enrolledTeams.length - teamsToRemove.length;
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: newCount })
        .eq('id', serieDId);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar contador da competição:', updateError);
      } else {
        console.log(`✅ Contador da Série D atualizado para ${newCount} times`);
      }
      
      // 5. Remover standings dos times removidos
      for (const team of teamsToRemove) {
        const { error: standingsError } = await supabase
          .from('game_standings')
          .delete()
          .eq('competition_id', serieDId)
          .eq('team_id', team.team_id);
        
        if (standingsError) {
          console.error(`    ❌ Erro ao remover standings de ${team.game_teams.name}:`, standingsError);
        }
      }
      
      console.log('🎉 Espaço liberado na Série D! Agora novos usuários podem se inscrever.');
      
    } else {
      console.log('⚠️ Não há times da máquina suficientes para remover. A Série D está cheia com times de usuário.');
      console.log('💡 Soluções possíveis:');
      console.log('   1. Criar mais competições');
      console.log('   2. Permitir inscrição em outras séries temporariamente');
      console.log('   3. Aumentar o limite de times por competição');
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir capacidade da Série D:', error);
  }
}

fixSerieDCapacity(); 