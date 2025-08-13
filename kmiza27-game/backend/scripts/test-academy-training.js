const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAcademyTraining() {
  try {
    console.log('🧪 Testando sistema de treinamento da academia...\n');

    // 1. Buscar um time para testar
    console.log('🔍 Buscando time para teste...');
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, owner_id')
      .limit(1);

    if (teamsError || !teams || teams.length === 0) {
      console.error('❌ Nenhum time encontrado para teste');
      return;
    }

    const testTeam = teams[0];
    console.log(`✅ Time selecionado: ${testTeam.name} (ID: ${testTeam.id})`);

    // 2. Verificar jogadores existentes
    console.log('\n📊 Verificando jogadores existentes...');
    
    const [youthPlayers, gamePlayers] = await Promise.all([
      supabase.from('youth_players').select('id, name, position, age, attributes, potential').eq('team_id', testTeam.id),
      supabase.from('game_players').select('id, name, position, age, passing, shooting, dribbling, defending, speed, stamina, strength, potential, current_ability').eq('team_id', testTeam.id)
    ]);

    const totalPlayers = (youthPlayers.data?.length || 0) + (gamePlayers.data?.length || 0);
    console.log(`📈 Total de jogadores: ${totalPlayers}`);
    console.log(`   - Youth players: ${youthPlayers.data?.length || 0}`);
    console.log(`   - Game players: ${gamePlayers.data?.length || 0}`);

    if (totalPlayers === 0) {
      console.log('⚠️ Nenhum jogador encontrado. Criando jogadores de teste...');
      await createTestPlayers(testTeam.id);
    }

    // 3. Verificar investimentos do time
    console.log('\n💰 Verificando investimentos do time...');
    const { data: investments, error: invError } = await supabase
      .from('game_investments')
      .select('item_id, name')
      .eq('team_id', testTeam.id);

    if (invError) {
      console.log('⚠️ Erro ao buscar investimentos:', invError.message);
    } else {
      console.log(`📋 Investimentos ativos: ${investments?.length || 0}`);
      if (investments && investments.length > 0) {
        investments.forEach(inv => console.log(`   - ${inv.name || inv.item_id}`));
      }
    }

    // 4. Simular aplicação de treinamento
    console.log('\n🏃 Simulando aplicação de treinamento...');
    
    // Buscar jogadores novamente após possível criação
    const [youthPlayersAfter, gamePlayersAfter] = await Promise.all([
      supabase.from('youth_players').select('id, name, position, age, attributes, potential').eq('team_id', testTeam.id),
      supabase.from('game_players').select('id, name, position, age, passing, shooting, dribbling, defending, speed, stamina, strength, potential, current_ability').eq('team_id', testTeam.id)
    ]);

    const allPlayers = [...(youthPlayersAfter.data || []), ...(gamePlayersAfter.data || [])];
    
    if (allPlayers.length > 0) {
      console.log(`🎯 Aplicando treinamento para ${allPlayers.length} jogadores...`);
      
      // Simular treinamento manual para alguns jogadores
      for (let i = 0; i < Math.min(3, allPlayers.length); i++) {
        const player = allPlayers[i];
        console.log(`\n   Jogador ${i + 1}: ${player.name} (${player.position})`);
        
        // Simular ganhos de atributos
        const simulatedGains = simulatePlayerTraining(player);
        console.log(`   📈 Ganhos simulados:`, simulatedGains);
        
        // Aplicar ganhos (simulação)
        await applySimulatedTraining(player, simulatedGains);
      }
      
      console.log('\n✅ Simulação de treinamento concluída!');
    }

    // 5. Verificar logs de treinamento
    console.log('\n📝 Verificando logs de treinamento...');
    const { data: logs, error: logsError } = await supabase
      .from('game_academy_logs')
      .select('*')
      .eq('team_id', testTeam.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.log('⚠️ Erro ao buscar logs:', logsError.message);
    } else {
      console.log(`📊 Logs encontrados: ${logs?.length || 0}`);
      if (logs && logs.length > 0) {
        logs.forEach((log, idx) => {
          console.log(`   ${idx + 1}. ${log.player_name} - ${log.focus} - ${log.intensity}`);
        });
      }
    }

    console.log('\n🎉 Teste da academia concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    process.exit(0);
  }
}

async function createTestPlayers(teamId) {
  try {
    console.log('   🏗️ Criando jogadores de teste...');
    
    // Criar alguns youth_players de teste
    const youthPlayers = [
      {
        name: 'João Silva',
        position: 'Goleiro',
        age: 17,
        team_id: teamId,
        attributes: { pace: 60, shooting: 30, passing: 50, dribbling: 40, defending: 70, physical: 75 },
        potential: 80,
        created_at: new Date().toISOString()
      },
      {
        name: 'Pedro Santos',
        position: 'Zagueiro',
        age: 18,
        team_id: teamId,
        attributes: { pace: 65, shooting: 40, passing: 55, dribbling: 45, defending: 75, physical: 80 },
        potential: 82,
        created_at: new Date().toISOString()
      }
    ];

    const { error: youthError } = await supabase
      .from('youth_players')
      .insert(youthPlayers);

    if (youthError) {
      console.log('   ⚠️ Erro ao criar youth_players:', youthError.message);
    } else {
      console.log('   ✅ 2 youth_players criados');
    }

    // Criar alguns game_players de teste
    const gamePlayers = [
      {
        name: 'Carlos Oliveira',
        position: 'CM',
        age: 22,
        team_id: teamId,
        passing: 70,
        shooting: 65,
        dribbling: 75,
        defending: 60,
        speed: 70,
        stamina: 75,
        strength: 70,
        potential: 85,
        current_ability: 72,
        created_at: new Date().toISOString()
      }
    ];

    const { error: gameError } = await supabase
      .from('game_players')
      .insert(gamePlayers);

    if (gameError) {
      console.log('   ⚠️ Erro ao criar game_players:', gameError.message);
    } else {
      console.log('   ✅ 1 game_player criado');
    }

  } catch (error) {
    console.log('   ❌ Erro ao criar jogadores de teste:', error.message);
  }
}

function simulatePlayerTraining(player) {
  const gains = {};
  
  if (player.attributes) {
    // Youth player
    Object.keys(player.attributes).forEach(attr => {
      const currentValue = player.attributes[attr];
      const gain = Math.random() * 2 + 0.5; // 0.5 a 2.5 pontos
      gains[attr] = Math.round(gain * 100) / 100;
    });
  } else {
    // Game player
    const attributes = ['passing', 'shooting', 'dribbling', 'defending', 'speed', 'stamina', 'strength'];
    attributes.forEach(attr => {
      if (player[attr] !== undefined) {
        const currentValue = player[attr];
        const gain = Math.random() * 2 + 0.5; // 0.5 a 2.5 pontos
        gains[attr] = Math.round(gain * 100) / 100;
      }
    });
  }
  
  return gains;
}

async function applySimulatedTraining(player, gains) {
  try {
    const updateData = { id: player.id };
    
    // Aplicar ganhos
    Object.entries(gains).forEach(([attr, gain]) => {
      if (player.attributes && player.attributes[attr]) {
        // Youth player
        const currentValue = player.attributes[attr];
        updateData.attributes = { ...player.attributes, [attr]: Math.min(99, currentValue + gain) };
      } else if (player[attr] !== undefined) {
        // Game player
        const currentValue = player[attr];
        updateData[attr] = Math.min(99, currentValue + gain);
      }
    });

    // Atualizar timestamp
    updateData.updated_at = new Date().toISOString();

    // Aplicar atualização
    if (player.attributes) {
      // Youth player
      const { error } = await supabase
        .from('youth_players')
        .update(updateData)
        .eq('id', player.id);
      
      if (error) {
        console.log(`     ⚠️ Erro ao atualizar youth_player: ${error.message}`);
      }
    } else {
      // Game player
      const { error } = await supabase
        .from('game_players')
        .update(updateData)
        .eq('id', player.id);
      
      if (error) {
        console.log(`     ⚠️ Erro ao atualizar game_player: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`     ❌ Erro ao aplicar treinamento: ${error.message}`);
  }
}

// Executar teste
testAcademyTraining().catch(console.error);
