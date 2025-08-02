const { getSupabaseServiceClient } = require('../config/supabase-connection');

const supabase = getSupabaseServiceClient('vps');

async function checkSerieDCapacity() {
  console.log('🔍 Verificando capacidade da Série D...\n');

  try {
    const serieDId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319';

    // 1. Verificar detalhes da Série D
    console.log('1. Verificando detalhes da Série D...');
    const { data: serieD, error: serieDError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('id', serieDId)
      .single();

    if (serieDError) {
      console.error('❌ Erro ao buscar Série D:', serieDError);
      return;
    }

    console.log(`✅ Série D: ${serieD.name}`);
    console.log(`   - Times atuais: ${serieD.current_teams}/${serieD.max_teams}`);
    console.log(`   - Vagas disponíveis: ${serieD.max_teams - serieD.current_teams}`);

    // 2. Verificar todos os times inscritos
    console.log('\n2. Verificando times inscritos...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type)
      `)
      .eq('competition_id', serieDId);

    if (enrollmentsError) {
      console.error('❌ Erro ao buscar inscrições:', enrollmentsError);
      return;
    }

    console.log(`✅ Total de times inscritos: ${enrollments.length}`);

    // Separar times da máquina e times do usuário
    const machineTeams = enrollments.filter(e => e.game_teams.team_type === 'machine');
    const userTeams = enrollments.filter(e => e.game_teams.team_type === 'user_created');

    console.log(`   - Times da máquina: ${machineTeams.length}`);
    console.log(`   - Times do usuário: ${userTeams.length}`);

    // 3. Mostrar times da máquina
    if (machineTeams.length > 0) {
      console.log('\n3. Times da máquina inscritos:');
      machineTeams.forEach(enrollment => {
        console.log(`   - ${enrollment.game_teams.name} (ID: ${enrollment.game_teams.id})`);
      });
    }

    // 4. Mostrar times do usuário
    if (userTeams.length > 0) {
      console.log('\n4. Times do usuário inscritos:');
      userTeams.forEach(enrollment => {
        console.log(`   - ${enrollment.game_teams.name} (ID: ${enrollment.game_teams.id})`);
      });
    }

    // 5. Verificar se há espaço para novos usuários
    if (serieD.current_teams >= serieD.max_teams) {
      console.log('\n⚠️  Série D está cheia!');
      
      if (machineTeams.length > 10) {
        console.log('🔧 Há muitos times da máquina. Podemos remover alguns para liberar espaço.');
        console.log('💡 Recomendação: Manter apenas 10 times da máquina para novos usuários.');
        
        const teamsToRemove = machineTeams.slice(10);
        console.log(`📋 Times que podem ser removidos: ${teamsToRemove.length}`);
        
        if (teamsToRemove.length > 0) {
          console.log('\n5. Removendo times da máquina para liberar espaço...');
          
          for (const enrollment of teamsToRemove) {
            console.log(`   - Removendo ${enrollment.game_teams.name}...`);
            
            // Remover da inscrição
            const { error: deleteError } = await supabase
              .from('game_competition_teams')
              .delete()
              .eq('team_id', enrollment.game_teams.id)
              .eq('competition_id', serieDId);

            if (deleteError) {
              console.error(`❌ Erro ao remover inscrição de ${enrollment.game_teams.name}:`, deleteError);
              continue;
            }

            // Remover da classificação
            const { error: standingsError } = await supabase
              .from('game_standings')
              .delete()
              .eq('team_id', enrollment.game_teams.id)
              .eq('competition_id', serieDId);

            if (standingsError) {
              console.error(`❌ Erro ao remover classificação de ${enrollment.game_teams.name}:`, standingsError);
            }

            console.log(`   ✅ ${enrollment.game_teams.name} removido`);
          }

          // Atualizar contador da competição
          const newCount = serieD.current_teams - teamsToRemove.length;
          const { error: updateError } = await supabase
            .from('game_competitions')
            .update({ current_teams: newCount })
            .eq('id', serieDId);

          if (updateError) {
            console.error('❌ Erro ao atualizar contador da competição:', updateError);
          } else {
            console.log(`✅ Contador atualizado: ${newCount}/${serieD.max_teams}`);
          }
        }
      } else {
        console.log('⚠️  Não há times da máquina suficientes para remover.');
        console.log('💡 Considere aumentar o max_teams da Série D ou criar uma nova competição.');
      }
    } else {
      console.log('\n✅ Série D tem vagas disponíveis!');
      console.log(`   - Vagas: ${serieD.max_teams - serieD.current_teams}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkSerieDCapacity(); 