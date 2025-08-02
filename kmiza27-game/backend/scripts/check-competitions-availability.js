const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function checkCompetitionsAvailability() {
  console.log('🔍 Verificando disponibilidade das competições...\n');
  
  try {
    // 1. Buscar todas as competições
    console.log('1. Buscando competições...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, status')
      .order('tier', { ascending: true });

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    console.log(`   Competições encontradas: ${competitions.length}\n`);
    competitions.forEach(comp => {
      const available = comp.current_teams < comp.max_teams;
      const status = available ? '✅ DISPONÍVEL' : '❌ CHEIA';
      console.log(`   ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams} - ${status}`);
    });

    // 2. Verificar times inscritos em cada competição
    console.log('\n2. Detalhamento por competição:');
    for (const comp of competitions) {
      console.log(`\n   📊 ${comp.name} (Tier ${comp.tier}):`);
      
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', comp.id);

      if (teamsError) {
        console.error(`   ❌ Erro ao buscar times de ${comp.name}:`, teamsError);
        continue;
      }

      console.log(`   Times inscritos: ${enrolledTeams.length}`);
      
      const userTeams = enrolledTeams.filter(et => et.game_teams.team_type === 'user_created');
      const machineTeams = enrolledTeams.filter(et => et.game_teams.team_type === 'machine');
      
      console.log(`   - Times de usuário: ${userTeams.length}`);
      console.log(`   - Times da máquina: ${machineTeams.length}`);
      
      if (userTeams.length > 0) {
        console.log('   Times de usuário:');
        userTeams.forEach(et => {
          console.log(`     - ${et.game_teams.name}`);
        });
      }
      
      if (machineTeams.length > 0) {
        console.log('   Times da máquina (primeiros 5):');
        machineTeams.slice(0, 5).forEach(et => {
          console.log(`     - ${et.game_teams.name}`);
        });
        if (machineTeams.length > 5) {
          console.log(`     ... e mais ${machineTeams.length - 5} times`);
        }
      }
    }

    // 3. Verificar qual competição seria escolhida pelo autoEnrollInCompetition
    console.log('\n3. Análise do autoEnrollInCompetition:');
    const availableCompetitions = competitions.filter(comp => 
      comp.status === 'active' && comp.current_teams < comp.max_teams
    ).sort((a, b) => a.tier - b.tier);

    if (availableCompetitions.length > 0) {
      const chosenCompetition = availableCompetitions[0];
      console.log(`   Competição que seria escolhida: ${chosenCompetition.name} (Tier ${chosenCompetition.tier})`);
      console.log(`   Vagas disponíveis: ${chosenCompetition.max_teams - chosenCompetition.current_teams}`);
    } else {
      console.log('   ❌ Nenhuma competição disponível encontrada');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

checkCompetitionsAvailability(); 