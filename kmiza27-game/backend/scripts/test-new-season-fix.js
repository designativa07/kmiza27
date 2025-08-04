const { getSupabaseClient } = require('../config/supabase-connection');

async function testNewSeasonFix() {
  try {
    console.log('🧪 TESTE: Verificando se nova temporada começa com todos os times zerados\n');
    
    const supabase = getSupabaseClient('vps');
    
    // ID de usuário de teste (substituir pelo ID real se necessário)
    const testUserId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';
    
    // 1. Verificar progresso atual do usuário
    console.log('1️⃣ Verificando progresso atual do usuário...');
    const { data: currentProgress } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', testUserId)
      .order('season_year', { ascending: false })
      .limit(1);
    
    if (!currentProgress || currentProgress.length === 0) {
      console.log('❌ Usuário não tem progresso ativo');
      return;
    }
    
    const userProgress = currentProgress[0];
    console.log(`✅ Usuário está na temporada ${userProgress.season_year}, Série ${getTierName(userProgress.current_tier)}`);
    console.log(`   Status: ${userProgress.season_status}, Jogos: ${userProgress.games_played}/38`);
    
    // 2. Verificar estatísticas dos times da máquina ANTES
    console.log('\n2️⃣ Verificando estatísticas dos times da máquina na temporada atual...');
    const { data: machineStatsBefore } = await supabase
      .from('game_user_machine_team_stats')
      .select('machine_team_name, points, games_played, wins, draws, losses')
      .eq('user_id', testUserId)
      .eq('season_year', userProgress.season_year)
      .eq('tier', userProgress.current_tier)
      .order('points', { ascending: false });
    
    console.log('📊 Estado dos times da máquina ANTES da nova temporada:');
    machineStatsBefore?.slice(0, 5).forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.machine_team_name}: ${team.points} pts, ${team.games_played} jogos`);
    });
    
    // 3. Simular início de nova temporada (apenas se a atual estiver completa)
    if (userProgress.games_played >= 38) {
      console.log('\n3️⃣ Temporada atual completa! Iniciando nova temporada...');
      
      const response = await fetch('http://localhost:3001/api/seasons/start-new-season', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ Nova temporada criada: ${result.data.season_year}`);
      
      // 4. Verificar se todos os times estão zerados na nova temporada
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
      
      console.log('\n4️⃣ Verificando se todos os times estão zerados na nova temporada...');
      
      const { data: newMachineStats } = await supabase
        .from('game_user_machine_team_stats')
        .select('machine_team_name, points, games_played, wins, draws, losses')
        .eq('user_id', testUserId)
        .eq('season_year', result.data.season_year)
        .eq('tier', userProgress.current_tier)
        .order('machine_team_name');
      
      console.log('📊 Estado dos times da máquina na NOVA temporada:');
      
      let allZeroed = true;
      newMachineStats?.slice(0, 10).forEach((team, index) => {
        const isZeroed = team.points === 0 && team.games_played === 0;
        if (!isZeroed) allZeroed = false;
        
        console.log(`   ${index + 1}. ${team.machine_team_name}: ${team.points} pts, ${team.games_played} jogos ${isZeroed ? '✅' : '❌'}`);
      });
      
      // 5. Verificar progresso do usuário na nova temporada
      const { data: newUserProgress } = await supabase
        .from('game_user_competition_progress')
        .select('*')
        .eq('user_id', testUserId)
        .eq('season_year', result.data.season_year)
        .single();
      
      console.log('\n📊 Progresso do usuário na nova temporada:');
      console.log(`   Pontos: ${newUserProgress.points}, Jogos: ${newUserProgress.games_played}`);
      console.log(`   Status: ${newUserProgress.season_status}`);
      
      // 6. Resultado final
      console.log('\n🎯 RESULTADO DO TESTE:');
      if (allZeroed && newUserProgress.points === 0 && newUserProgress.games_played === 0) {
        console.log('✅ SUCESSO! Todos os times (incluindo times da máquina) começaram zerados');
        console.log('✅ A correção funcionou corretamente!');
      } else {
        console.log('❌ FALHA! Alguns times não estão zerados na nova temporada');
        console.log('❌ A correção não funcionou completamente');
      }
      
    } else {
      console.log('\n⏳ Temporada atual ainda não está completa');
      console.log(`   Faltam ${38 - userProgress.games_played} jogos para terminar`);
      console.log('   Complete a temporada para testar o início de uma nova');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

// Executar teste
testNewSeasonFix();