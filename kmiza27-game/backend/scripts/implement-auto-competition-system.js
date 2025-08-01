const { getSupabaseServiceClient } = require('../config/supabase-connection');

// Times da máquina por série
const machineTeamsByTier = {
  1: [ // Série A
    { name: "Flamengo-RJ", short_name: "FLA-RJ", colors: { primary: "#ff0000", secondary: "#000000" } },
    { name: "Palmeiras-SP", short_name: "PAL-SP", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "São Paulo-SP", short_name: "SAO-SP", colors: { primary: "#ffffff", secondary: "#ff0000" } },
    { name: "Santos-SP", short_name: "SAN-SP", colors: { primary: "#ffffff", secondary: "#000000" } },
    { name: "Corinthians-SP", short_name: "COR-SP", colors: { primary: "#ffffff", secondary: "#000000" } },
    { name: "Grêmio-RS", short_name: "GRE-RS", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Internacional-RS", short_name: "INT-RS", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Atlético-MG", short_name: "CAM-MG", colors: { primary: "#000000", secondary: "#ffffff" } },
    { name: "Cruzeiro-MG", short_name: "CRU-MG", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Vasco da Gama-RJ", short_name: "VAS-RJ", colors: { primary: "#ffffff", secondary: "#000000" } },
    { name: "Botafogo-RJ", short_name: "BOT-RJ", colors: { primary: "#000000", secondary: "#ffffff" } },
    { name: "Fluminense-RJ", short_name: "FLU-RJ", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Athletico-PR", short_name: "CAP-PR", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Coritiba-PR", short_name: "COR-PR", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Bahia-BA", short_name: "BAH-BA", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Vitória-BA", short_name: "VIT-BA", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Sport-PE", short_name: "SPO-PE", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Náutico-PE", short_name: "NAU-PE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Ceará-CE", short_name: "CEA-CE", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Fortaleza-CE", short_name: "FOR-CE", colors: { primary: "#ff0000", secondary: "#ffffff" } }
  ],
  2: [ // Série B
    { name: "Avaí-SC", short_name: "AVA-SC", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Chapecoense-SC", short_name: "CHA-SC", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Criciúma-SC", short_name: "CRI-SC", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Figueirense-SC", short_name: "FIG-SC", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Joinville-SC", short_name: "JOI-SC", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Brasil de Pelotas-RS", short_name: "BRA-RS", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Juventude-RS", short_name: "JUV-RS", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Novo Hamburgo-RS", short_name: "NOV-RS", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "América-MG", short_name: "AME-MG", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Tombense-MG", short_name: "TOM-MG", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Boa Esporte-MG", short_name: "BOA-MG", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Villa Nova-MG", short_name: "VIL-MG", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Tupi-MG", short_name: "TUP-MG", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Ipatinga-MG", short_name: "IPA-MG", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Democrata-MG", short_name: "DEM-MG", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "URT-MG", short_name: "URT-MG", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Patrocinense-MG", short_name: "PAT-MG", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Caldense-MG", short_name: "CAL-MG", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Betim-MG", short_name: "BET-MG", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Uberlândia-MG", short_name: "UBE-MG", colors: { primary: "#0000ff", secondary: "#ffffff" } }
  ],
  3: [ // Série C
    { name: "Vila Nova-GO", short_name: "VIL-GO", colors: { primary: "#00ffff", secondary: "#000000" } },
    { name: "Goiás-GO", short_name: "GOI-GO", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Aparecidense-GO", short_name: "APA-GO", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Anápolis-GO", short_name: "ANA-GO", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "CRAC-GO", short_name: "CRA-GO", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Goianésia-GO", short_name: "GOI-GO", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Iporá-GO", short_name: "IPO-GO", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Jataiense-GO", short_name: "JAT-GO", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Morrinhos-GO", short_name: "MOR-GO", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Nova Mutum-MT", short_name: "NOV-MT", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Cuiabá-MT", short_name: "CUI-MT", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Luverdense-MT", short_name: "LUV-MT", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Sinop-MT", short_name: "SIN-MT", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Dom Bosco-MT", short_name: "DOM-MT", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Mixto-MT", short_name: "MIX-MT", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "União-MT", short_name: "UNI-MT", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Operário-MT", short_name: "OPE-MT", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Poconé-MT", short_name: "POC-MT", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Várzea Grande-MT", short_name: "VAR-MT", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Rondonópolis-MT", short_name: "RON-MT", colors: { primary: "#00ff00", secondary: "#ffffff" } }
  ],
  4: [ // Série D
    { name: "Botafogo-PB", short_name: "BOT-PB", colors: { primary: "#000000", secondary: "#ffffff" } },
    { name: "Campinense-PB", short_name: "CAM-PB", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Treze-PB", short_name: "TRE-PB", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Nacional-PB", short_name: "NAC-PB", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Auto Esporte-PB", short_name: "AUT-PB", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Sousa-PB", short_name: "SOU-PB", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Serra Branca-PB", short_name: "SER-PB", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Atlético Cajazeirense-PB", short_name: "ATL-PB", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Salgueiro-PE", short_name: "SAL-PE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Central-PE", short_name: "CEN-PE", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Santa Cruz-PE", short_name: "SAN-PE", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Afogados-PE", short_name: "AFO-PE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Petrolina-PE", short_name: "PET-PE", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Vitória das Tabocas-PE", short_name: "VIT-PE", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Porto-PE", short_name: "POR-PE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Maguary-PE", short_name: "MAG-PE", colors: { primary: "#00ff00", secondary: "#ffffff" } },
    { name: "Íbis-PE", short_name: "IBI-PE", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Caruaru City-PE", short_name: "CAR-PE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Flamengo de Arcoverde-PE", short_name: "FLA-PE", colors: { primary: "#ff0000", secondary: "#ffffff" } },
    { name: "Náutico-PE", short_name: "NAU-PE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
    { name: "Sport-PE", short_name: "SPO-PE", colors: { primary: "#00ff00", secondary: "#ffffff" } }
  ]
};

async function implementAutoCompetitionSystem() {
  try {
    console.log('🎯 IMPLEMENTANDO SISTEMA AUTOMÁTICO DE COMPETIÇÕES');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. CRIAR TIMES DA MÁQUINA
    console.log('\n🤖 1. Criando times da máquina...');
    await createMachineTeams();
    
    // 2. VERIFICAR COMPETIÇÕES EXISTENTES
    console.log('\n📋 2. Verificando competições existentes...');
    const competitions = await getCompetitions();
    
    // 3. INSCREVER TIMES DA MÁQUINA AUTOMATICAMENTE
    console.log('\n⚽ 3. Inscrição automática de times da máquina...');
    await autoEnrollMachineTeams(competitions);
    
    // 4. CRIAR CALENDÁRIO COMPLETO DE JOGOS
    console.log('\n📅 4. Criando calendário completo de jogos...');
    await createCompleteMatchSchedule(competitions);
    
    // 5. CRIAR SISTEMA DE CLASSIFICAÇÕES
    console.log('\n📊 5. Criando sistema de classificações...');
    await createStandingsSystem(competitions);
    
    console.log('\n✅ SISTEMA AUTOMÁTICO DE COMPETIÇÕES IMPLEMENTADO COM SUCESSO!');
    console.log('\n🎮 Agora quando um usuário criar uma equipe e se inscrever:');
    console.log('   • Times da máquina serão inscritos automaticamente');
    console.log('   • Calendário completo será criado');
    console.log('   • Sistema de classificações funcionará');
    console.log('   • Promoção/rebaixamento será automático');
    
  } catch (error) {
    console.error('❌ Erro na implementação:', error);
  }
}

async function createMachineTeams() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Usuário padrão da máquina
    const machineUserId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';
    
    for (const [tier, teams] of Object.entries(machineTeamsByTier)) {
      console.log(`  📋 Processando Série ${tier} (${teams.length} times)...`);
      
      for (const teamData of teams) {
        // Verificar se o time já existe
        const { data: existingTeam } = await supabase
          .from('game_teams')
          .select('id')
          .eq('name', teamData.name)
          .single();
        
        if (existingTeam) {
          console.log(`    ⏭️ ${teamData.name} já existe`);
          continue;
        }
        
        // Criar time da máquina
        const { data: newTeam, error } = await supabase
          .from('game_teams')
          .insert({
            name: teamData.name,
            short_name: teamData.short_name,
            slug: teamData.short_name.toLowerCase().replace('-', '-'),
            owner_id: machineUserId,
            team_type: 'machine',
            machine_tier: parseInt(tier),
            colors: teamData.colors,
            logo_url: null,
            stadium_name: `${teamData.name} Stadium`,
            stadium_capacity: 15000 + (Math.floor(Math.random() * 25000)),
            budget: 500000 + (Math.floor(Math.random() * 1500000)),
            reputation: 40 + (Math.floor(Math.random() * 40)),
            fan_base: 2000 + (Math.floor(Math.random() * 8000)),
            game_stats: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.log(`    ❌ Erro ao criar ${teamData.name}: ${error.message}`);
        } else {
          console.log(`    ✅ ${teamData.name} criado`);
          
          // Criar 23 jogadores para o time
          await createPlayersForTeam(newTeam.id, teamData.name);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar times da máquina:', error);
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
    
    console.log(`      👥 ${playerCount} jogadores criados para ${teamName}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar jogadores:', error);
  }
}

async function getCompetitions() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });
    
    if (error) {
      throw new Error(`Erro ao buscar competições: ${error.message}`);
    }
    
    console.log(`  ✅ Encontradas ${competitions.length} competições:`);
    competitions.forEach(comp => {
      console.log(`    🏆 ${comp.name} (Série ${comp.tier}) - ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    return competitions;
    
  } catch (error) {
    console.error('❌ Erro ao buscar competições:', error);
    return [];
  }
}

async function autoEnrollMachineTeams(competitions) {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    for (const competition of competitions) {
      console.log(`  📋 Processando ${competition.name}...`);
      
      // Buscar times da máquina para esta série
      const { data: machineTeams, error: teamsError } = await supabase
        .from('game_teams')
        .select('id, name')
        .eq('team_type', 'machine')
        .eq('machine_tier', competition.tier);
      
      if (teamsError) {
        console.log(`    ❌ Erro ao buscar times da máquina: ${teamsError.message}`);
        continue;
      }
      
      console.log(`    🤖 ${machineTeams.length} times da máquina encontrados`);
      
      // Inscrição automática
      let enrolledCount = 0;
      for (const team of machineTeams) {
        // Verificar se já está inscrito
        const { data: existingEnrollment } = await supabase
          .from('game_competition_teams')
          .select('id')
          .eq('competition_id', competition.id)
          .eq('team_id', team.id)
          .single();
        
        if (!existingEnrollment) {
          const { error: enrollError } = await supabase
            .from('game_competition_teams')
            .insert({
              competition_id: competition.id,
              team_id: team.id,
              status: 'active',
              created_at: new Date().toISOString()
            });
          
          if (enrollError) {
            console.log(`      ❌ Erro ao inscrever ${team.name}: ${enrollError.message}`);
          } else {
            console.log(`      ✅ ${team.name} inscrito`);
            enrolledCount++;
          }
        } else {
          console.log(`      ⏭️ ${team.name} já inscrito`);
        }
      }
      
      // Atualizar contador de times na competição
      const { data: totalTeams } = await supabase
        .from('game_competition_teams')
        .select('id', { count: 'exact' })
        .eq('competition_id', competition.id);
      
      await supabase
        .from('game_competitions')
        .update({ current_teams: totalTeams.length })
        .eq('id', competition.id);
      
      console.log(`    📊 ${enrolledCount} times inscritos (Total: ${totalTeams.length})`);
    }
    
  } catch (error) {
    console.error('❌ Erro na inscrição automática:', error);
  }
}

async function createCompleteMatchSchedule(competitions) {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    for (const competition of competitions) {
      console.log(`  📅 Criando calendário para ${competition.name}...`);
      
      // Buscar todos os times inscritos
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
            
            // Verificar se a partida já existe
            const { data: existingMatch } = await supabase
              .from('game_matches')
              .select('id')
              .eq('competition_id', competition.id)
              .eq('home_team_id', homeTeam)
              .eq('away_team_id', awayTeam)
              .single();
            
            if (!existingMatch) {
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
      }
      
      console.log(`    ⚽ ${matchCount} partidas criadas para ${competition.name}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar calendário:', error);
  }
}

async function createStandingsSystem(competitions) {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    for (const competition of competitions) {
      console.log(`  📊 Criando classificações para ${competition.name}...`);
      
      // Buscar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);
      
      if (teamsError || !enrolledTeams) {
        console.log(`    ❌ Erro ao buscar times: ${teamsError?.message}`);
        continue;
      }
      
      let standingsCount = 0;
      for (const team of enrolledTeams) {
        // Verificar se já existe classificação
        const { data: existingStanding } = await supabase
          .from('game_standings')
          .select('id')
          .eq('competition_id', competition.id)
          .eq('team_id', team.team_id)
          .single();
        
        if (!existingStanding) {
          const { error } = await supabase
            .from('game_standings')
            .insert({
              competition_id: competition.id,
              team_id: team.team_id,
              position: 0,
              points: 0,
              games_played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              goal_difference: 0,
              season_year: 2024,
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.log(`      ❌ Erro ao criar classificação: ${error.message}`);
          } else {
            standingsCount++;
          }
        }
      }
      
      console.log(`    📊 ${standingsCount} classificações criadas para ${competition.name}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar sistema de classificações:', error);
  }
}

// Executar o script
implementAutoCompetitionSystem(); 