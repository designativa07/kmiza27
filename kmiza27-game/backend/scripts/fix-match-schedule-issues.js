const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixMatchScheduleIssues() {
  try {
    console.log('🔧 CORRIGINDO PROBLEMAS DO SISTEMA DE COMPETIÇÕES');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. ADICIONAR COLUNA ROUND À TABELA GAME_MATCHES
    console.log('\n📋 1. Adicionando coluna round à tabela game_matches...');
    await addRoundColumn();
    
    // 2. CRIAR JOGADORES PARA TIMES DA MÁQUINA
    console.log('\n👥 2. Criando jogadores para times da máquina...');
    await createPlayersForMachineTeams();
    
    // 3. CORRIGIR SLUGS DUPLICADOS
    console.log('\n🔧 3. Corrigindo slugs duplicados...');
    await fixDuplicateSlugs();
    
    // 4. RECRIAR CALENDÁRIO DE JOGOS
    console.log('\n📅 4. Recriando calendário de jogos...');
    await recreateMatchSchedule();
    
    console.log('\n✅ PROBLEMAS CORRIGIDOS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

async function addRoundColumn() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Verificar se a coluna já existe
    const { data: columns, error: checkError } = await supabase
      .rpc('get_table_columns', { table_name: 'game_matches' });
    
    if (checkError) {
      console.log('  ⚠️ Não foi possível verificar colunas, tentando adicionar...');
    } else {
      const hasRound = columns?.some(col => col.column_name === 'round');
      if (hasRound) {
        console.log('  ✅ Coluna round já existe');
        return;
      }
    }
    
    // Adicionar coluna round
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE game_matches 
        ADD COLUMN IF NOT EXISTS round INTEGER DEFAULT 1;
      `
    });
    
    if (error) {
      console.log(`  ❌ Erro ao adicionar coluna round: ${error.message}`);
      console.log('  📝 Execute manualmente no Supabase:');
      console.log('     ALTER TABLE game_matches ADD COLUMN IF NOT EXISTS round INTEGER DEFAULT 1;');
    } else {
      console.log('  ✅ Coluna round adicionada com sucesso');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna round:', error);
  }
}

async function createPlayersForMachineTeams() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar times da máquina sem jogadores
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'machine');
    
    if (teamsError) {
      console.log(`  ❌ Erro ao buscar times da máquina: ${teamsError.message}`);
      return;
    }
    
    console.log(`  🤖 ${machineTeams.length} times da máquina encontrados`);
    
    for (const team of machineTeams) {
      // Verificar se já tem jogadores
      const { data: existingPlayers, error: playersError } = await supabase
        .from('youth_players')
        .select('id')
        .eq('team_id', team.id)
        .limit(1);
      
      if (playersError) {
        console.log(`    ❌ Erro ao verificar jogadores de ${team.name}: ${playersError.message}`);
        continue;
      }
      
      if (existingPlayers && existingPlayers.length > 0) {
        console.log(`    ⏭️ ${team.name} já tem jogadores`);
        continue;
      }
      
      console.log(`    👥 Criando jogadores para ${team.name}...`);
      await createPlayersForTeam(team.id, team.name);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar jogadores:', error);
  }
}

async function createPlayersForTeam(teamId, teamName) {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    const positions = [
      { name: 'Goleiro', count: 3, attributes: { defending: [75, 90], physical: [70, 85] } },
      { name: 'Zagueiro', count: 4, attributes: { defending: [70, 85], physical: [70, 85] } },
      { name: 'Lateral Esquerdo', count: 2, attributes: { pace: [70, 85], defending: [65, 80] } },
      { name: 'Lateral Direito', count: 2, attributes: { pace: [70, 85], defending: [65, 80] } },
      { name: 'Volante', count: 2, attributes: { defending: [70, 85], physical: [70, 85] } },
      { name: 'Meia Central', count: 2, attributes: { passing: [70, 85], dribbling: [65, 80] } },
      { name: 'Meia Ofensivo', count: 2, attributes: { passing: [70, 85], dribbling: [65, 80] } },
      { name: 'Ponta Esquerda', count: 1, attributes: { pace: [70, 85], dribbling: [65, 80] } },
      { name: 'Ponta Direita', count: 1, attributes: { pace: [70, 85], dribbling: [65, 80] } },
      { name: 'Atacante', count: 2, attributes: { shooting: [70, 85], pace: [70, 85] } },
      { name: 'Centroavante', count: 2, attributes: { shooting: [70, 85], physical: [70, 85] } }
    ];
    
    const firstNames = ['João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Carlos', 'André', 'Felipe', 'Thiago', 'Diego', 'Marcos', 'Ricardo', 'Alexandre', 'Daniel', 'Roberto', 'Fernando', 'Rodrigo', 'Marcelo'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Alves', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];
    
    let playerCount = 0;
    
    for (const position of positions) {
      for (let i = 0; i < position.count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        
        // Gerar atributos base
        const pace = 50 + Math.floor(Math.random() * 30);
        const shooting = 50 + Math.floor(Math.random() * 30);
        const passing = 50 + Math.floor(Math.random() * 30);
        const dribbling = 50 + Math.floor(Math.random() * 30);
        const defending = 50 + Math.floor(Math.random() * 30);
        const physical = 50 + Math.floor(Math.random() * 30);
        
        // Ajustar atributos por posição
        const adjustedAttributes = { ...position.attributes };
        for (const [attr, range] of Object.entries(adjustedAttributes)) {
          const [min, max] = range;
          const value = min + Math.floor(Math.random() * (max - min));
          adjustedAttributes[attr] = value;
        }
        
        const { error } = await supabase
          .from('youth_players')
          .insert({
            team_id: teamId,
            name: fullName,
            position: position.name,
            age: 18 + Math.floor(Math.random() * 5),
            pace: adjustedAttributes.pace || pace,
            shooting: adjustedAttributes.shooting || shooting,
            passing: adjustedAttributes.passing || passing,
            dribbling: adjustedAttributes.dribbling || dribbling,
            defending: adjustedAttributes.defending || defending,
            physical: adjustedAttributes.physical || physical,
            potential: 60 + Math.floor(Math.random() * 30),
            overall: Math.floor((pace + shooting + passing + dribbling + defending + physical) / 6),
            created_at: new Date().toISOString()
          });
        
        if (!error) {
          playerCount++;
        }
      }
    }
    
    console.log(`      ✅ ${playerCount} jogadores criados para ${teamName}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar jogadores:', error);
  }
}

async function fixDuplicateSlugs() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar times com slugs duplicados
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, slug')
      .eq('team_type', 'machine')
      .order('name');
    
    if (teamsError) {
      console.log(`  ❌ Erro ao buscar times: ${teamsError.message}`);
      return;
    }
    
    const slugCounts = {};
    teams.forEach(team => {
      slugCounts[team.slug] = (slugCounts[team.slug] || 0) + 1;
    });
    
    const duplicates = Object.entries(slugCounts).filter(([slug, count]) => count > 1);
    
    if (duplicates.length === 0) {
      console.log('  ✅ Nenhum slug duplicado encontrado');
      return;
    }
    
    console.log(`  🔧 Encontrados ${duplicates.length} slugs duplicados`);
    
    for (const [duplicateSlug, count] of duplicates) {
      const teamsWithSlug = teams.filter(team => team.slug === duplicateSlug);
      
      for (let i = 1; i < teamsWithSlug.length; i++) {
        const team = teamsWithSlug[i];
        const newSlug = `${duplicateSlug}-${i + 1}`;
        
        const { error } = await supabase
          .from('game_teams')
          .update({ slug: newSlug })
          .eq('id', team.id);
        
        if (error) {
          console.log(`    ❌ Erro ao corrigir slug de ${team.name}: ${error.message}`);
        } else {
          console.log(`    ✅ ${team.name}: ${duplicateSlug} → ${newSlug}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir slugs:', error);
  }
}

async function recreateMatchSchedule() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Limpar partidas existentes
    console.log('  🗑️ Limpando partidas existentes...');
    const { error: deleteError } = await supabase
      .from('game_matches')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todas
    
    if (deleteError) {
      console.log(`  ❌ Erro ao limpar partidas: ${deleteError.message}`);
    } else {
      console.log('  ✅ Partidas limpas');
    }
    
    // Buscar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.log(`  ❌ Erro ao buscar competições: ${compError.message}`);
      return;
    }
    
    for (const competition of competitions) {
      console.log(`  📅 Recriando calendário para ${competition.name}...`);
      
      // Buscar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);
      
      if (teamsError || !enrolledTeams || enrolledTeams.length < 2) {
        console.log(`    ⚠️ Competição ${competition.name} não tem times suficientes`);
        continue;
      }
      
      const teamIds = enrolledTeams.map(t => t.team_id);
      console.log(`    👥 ${teamIds.length} times para criar partidas`);
      
      // Criar partidas (todos contra todos - ida e volta)
      let matchCount = 0;
      const startDate = new Date();
      let currentDate = new Date(startDate);
      
      for (let round = 1; round <= 2; round++) { // Ida e volta
        for (let i = 0; i < teamIds.length; i++) {
          for (let j = i + 1; j < teamIds.length; j++) {
            const homeTeam = round === 1 ? teamIds[i] : teamIds[j];
            const awayTeam = round === 1 ? teamIds[j] : teamIds[i];
            
            // Adicionar 3 dias entre partidas
            currentDate.setDate(currentDate.getDate() + 3);
            
            const { error } = await supabase
              .from('game_matches')
              .insert({
                competition_id: competition.id,
                home_team_id: homeTeam,
                away_team_id: awayTeam,
                status: 'scheduled',
                match_date: currentDate.toISOString(),
                round: round,
                created_at: new Date().toISOString()
              });
            
            if (error) {
              console.log(`      ❌ Erro ao criar partida: ${error.message}`);
            } else {
              matchCount++;
            }
          }
        }
      }
      
      console.log(`    ⚽ ${matchCount} partidas criadas para ${competition.name}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao recriar calendário:', error);
  }
}

// Executar correções
fixMatchScheduleIssues(); 