const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixPlayerCreation() {
  try {
    console.log('🔧 CORRIGINDO CRIAÇÃO DE JOGADORES');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. VERIFICAR ESTRUTURA CORRETA
    console.log('\n📋 1. Verificando estrutura correta da tabela youth_players...');
    
    const { data: samplePlayer, error: checkError } = await supabase
      .from('youth_players')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log(`  ❌ Erro ao acessar tabela: ${checkError.message}`);
      return;
    }
    
    if (samplePlayer && samplePlayer.length > 0) {
      console.log('  ✅ Estrutura da tabela:');
      console.log('  📋 Colunas:', Object.keys(samplePlayer[0]));
      console.log('  📊 Exemplo de attributes:', samplePlayer[0].attributes);
    }
    
    // 2. BUSCAR TIMES DA MÁQUINA
    console.log('\n🤖 2. Buscando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'machine')
      .limit(5); // Testar com 5 times primeiro
    
    if (teamsError) {
      console.log(`  ❌ Erro ao buscar times: ${teamsError.message}`);
      return;
    }
    
    console.log(`  ✅ ${machineTeams.length} times encontrados`);
    
    // 3. CRIAR JOGADORES COM ESTRUTURA CORRETA
    console.log('\n👥 3. Criando jogadores com estrutura correta...');
    
    for (const team of machineTeams) {
      console.log(`  📋 Processando ${team.name}...`);
      
      // Verificar se já tem jogadores
      const { data: existingPlayers, error: playersError } = await supabase
        .from('youth_players')
        .select('id')
        .eq('team_id', team.id)
        .limit(1);
      
      if (playersError) {
        console.log(`    ❌ Erro ao verificar jogadores: ${playersError.message}`);
        continue;
      }
      
      if (existingPlayers && existingPlayers.length > 0) {
        console.log(`    ⏭️ ${team.name} já tem jogadores`);
        continue;
      }
      
      // Criar 23 jogadores para o time
      await createPlayersForTeamCorrected(team.id, team.name);
    }
    
    console.log('\n✅ CRIAÇÃO DE JOGADORES CORRIGIDA!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

async function createPlayersForTeamCorrected(teamId, teamName) {
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
        
        // Criar objeto attributes no formato correto
        const attributes = {
          pace: adjustedAttributes.pace || pace,
          shooting: adjustedAttributes.shooting || shooting,
          passing: adjustedAttributes.passing || passing,
          dribbling: adjustedAttributes.dribbling || dribbling,
          defending: adjustedAttributes.defending || defending,
          physical: adjustedAttributes.physical || physical
        };
        
        // Calcular overall
        const overall = Math.floor((attributes.pace + attributes.shooting + attributes.passing + attributes.dribbling + attributes.defending + attributes.physical) / 6);
        
        // Calcular data de nascimento (idade entre 18-22)
        const age = 18 + Math.floor(Math.random() * 5);
        const birthYear = new Date().getFullYear() - age;
        const birthMonth = 1 + Math.floor(Math.random() * 12);
        const birthDay = 1 + Math.floor(Math.random() * 28);
        const dateOfBirth = new Date(birthYear, birthMonth - 1, birthDay).toISOString().split('T')[0];
        
        const playerData = {
          team_id: teamId,
          name: fullName,
          position: position.name,
          age: age,
          date_of_birth: dateOfBirth,
          nationality: 'Brasileiro',
          category_id: null, // Será definido depois se necessário
          attributes: attributes,
          potential: 60 + Math.floor(Math.random() * 30),
          status: 'active',
          scouted_date: new Date().toISOString().split('T')[0],
          contract_date: new Date().toISOString().split('T')[0]
        };
        
        const { error } = await supabase
          .from('youth_players')
          .insert(playerData);
        
        if (error) {
          console.log(`      ❌ Erro ao criar jogador: ${error.message}`);
        } else {
          playerCount++;
        }
      }
    }
    
    console.log(`    ✅ ${playerCount} jogadores criados para ${teamName}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar jogadores:', error);
  }
}

// Executar correção
fixPlayerCreation(); 