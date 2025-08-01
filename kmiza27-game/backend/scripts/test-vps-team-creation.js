const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração para o Supabase na VPS
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVPSTeamCreation() {
  try {
    console.log('🧪 Testando criação de time na VPS...');
    
    // 1. Criar um usuário primeiro
    console.log('📋 Criando usuário...');
    const { data: user, error: userError } = await supabase
      .from('game_users')
      .insert({
        email: `user-${Date.now()}@kmiza27.com`,
        username: `user-${Date.now()}`,
        display_name: 'Usuário Teste VPS'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      return;
    }

    console.log('✅ Usuário criado:', user.id);

    // 2. Criar um time
    console.log('📋 Criando time...');
    const { data: team, error: teamError } = await supabase
      .from('game_teams')
      .insert({
        name: 'Time VPS Teste',
        slug: `time-vps-${Date.now()}`,
        short_name: 'TVT',
        owner_id: user.id,
        team_type: 'user_created',
        colors: {
          primary: '#FF0000',
          secondary: '#0000FF'
        },
        stadium_name: 'Estádio VPS',
        stadium_capacity: 20000,
        budget: 3000000,
        reputation: 70,
        fan_base: 10000,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (teamError) {
      console.error('❌ Erro ao criar time:', teamError);
      return;
    }

    console.log('✅ Time criado:', team.name);
    console.log('🆔 ID do time:', team.id);

    // 3. Criar academia básica
    console.log('📋 Criando academia...');
    const { error: academyError } = await supabase
      .from('youth_academies')
      .insert({
        team_id: team.id,
        level: 1,
        facilities: {
          training_fields: 1,
          gym_quality: 1,
          medical_center: 1,
          dormitory_capacity: 10,
          coaching_staff: 2
        },
        investment: 0,
        monthly_cost: 50000,
        efficiency_multiplier: 1.0
      });

    if (academyError) {
      console.error('❌ Erro ao criar academia:', academyError);
    } else {
      console.log('✅ Academia criada');
    }

    // 4. Criar 23 jogadores
    console.log('📋 Criando jogadores...');
    const players = [];
    const playerPositions = [
      { position: 'Goleiro', count: 3 },
      { position: 'Zagueiro', count: 4 },
      { position: 'Lateral Esquerdo', count: 2 },
      { position: 'Lateral Direito', count: 2 },
      { position: 'Atacante', count: 2 },
      { position: 'Centroavante', count: 2 },
      { position: 'Meia Ofensivo', count: 2 },
      { position: 'Volante', count: 2 },
      { position: 'Meia Central', count: 2 },
      { position: 'Ponta Esquerda', count: 1 },
      { position: 'Ponta Direita', count: 1 }
    ];

    let playerNumber = 1;
    const names = [
      'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'Lucas Pereira',
      'Gabriel Ferreira', 'Rafael Almeida', 'Bruno Rodrigues', 'Thiago Lima', 'André Souza',
      'Daniel Martins', 'Ricardo Barbosa', 'Fernando Cardoso', 'Marcos Teixeira', 'Paulo Gomes',
      'Roberto Carvalho', 'Eduardo Mendes', 'Alexandre Santos', 'Felipe Costa', 'Diego Silva',
      'Matheus Oliveira', 'Vinícius Pereira', 'Guilherme Santos'
    ];

    for (const pos of playerPositions) {
      for (let i = 0; i < pos.count; i++) {
        const name = names[playerNumber - 1] || `Jogador ${playerNumber}`;
        const age = Math.floor(Math.random() * 18) + 18;
        const birthYear = new Date().getFullYear() - age;
        const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

        // Gerar atributos baseados na posição
        const baseAttributes = {
          pace: Math.floor(Math.random() * 20) + 60,
          shooting: Math.floor(Math.random() * 20) + 60,
          passing: Math.floor(Math.random() * 20) + 60,
          dribbling: Math.floor(Math.random() * 20) + 60,
          defending: Math.floor(Math.random() * 20) + 60,
          physical: Math.floor(Math.random() * 20) + 60
        };

        let attributes = baseAttributes;
        switch (pos.position) {
          case 'Goleiro':
            attributes = { ...baseAttributes, defending: Math.floor(Math.random() * 15) + 75, physical: Math.floor(Math.random() * 15) + 70 };
            break;
          case 'Zagueiro':
            attributes = { ...baseAttributes, defending: Math.floor(Math.random() * 15) + 70, physical: Math.floor(Math.random() * 15) + 70 };
            break;
          case 'Lateral Esquerdo':
          case 'Lateral Direito':
            attributes = { ...baseAttributes, pace: Math.floor(Math.random() * 15) + 70, defending: Math.floor(Math.random() * 15) + 65 };
            break;
          case 'Volante':
            attributes = { ...baseAttributes, defending: Math.floor(Math.random() * 15) + 70, physical: Math.floor(Math.random() * 15) + 70 };
            break;
          case 'Meia Central':
            attributes = { ...baseAttributes, passing: Math.floor(Math.random() * 15) + 70, dribbling: Math.floor(Math.random() * 15) + 65 };
            break;
          case 'Meia Ofensivo':
            attributes = { ...baseAttributes, passing: Math.floor(Math.random() * 15) + 70, dribbling: Math.floor(Math.random() * 15) + 70 };
            break;
          case 'Ponta Esquerda':
          case 'Ponta Direita':
            attributes = { ...baseAttributes, pace: Math.floor(Math.random() * 15) + 75, dribbling: Math.floor(Math.random() * 15) + 70 };
            break;
          case 'Atacante':
            attributes = { ...baseAttributes, shooting: Math.floor(Math.random() * 15) + 70, pace: Math.floor(Math.random() * 15) + 70 };
            break;
          case 'Centroavante':
            attributes = { ...baseAttributes, shooting: Math.floor(Math.random() * 15) + 75, physical: Math.floor(Math.random() * 15) + 70 };
            break;
        }

        const potential = {
          pace: Math.min(99, attributes.pace + Math.floor(Math.random() * 10) - 5),
          shooting: Math.min(99, attributes.shooting + Math.floor(Math.random() * 10) - 5),
          passing: Math.min(99, attributes.passing + Math.floor(Math.random() * 10) - 5),
          dribbling: Math.min(99, attributes.dribbling + Math.floor(Math.random() * 10) - 5),
          defending: Math.min(99, attributes.defending + Math.floor(Math.random() * 10) - 5),
          physical: Math.min(99, attributes.physical + Math.floor(Math.random() * 10) - 5)
        };

        players.push({
          team_id: team.id,
          name: name,
          position: pos.position,
          date_of_birth: birthDate.toISOString().split('T')[0],
          nationality: 'Brasil',
          attributes: attributes,
          potential: potential,
          status: 'contracted',
          contract_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });

        playerNumber++;
      }
    }

    // Inserir todos os jogadores
    const { error: playersError } = await supabase
      .from('youth_players')
      .insert(players);

    if (playersError) {
      console.error('❌ Erro ao criar jogadores:', playersError);
      return;
    }

    console.log(`✅ ${players.length} jogadores criados com sucesso!`);

    // 5. Verificar os jogadores criados
    console.log('📋 Verificando jogadores...');
    const { data: createdPlayers, error: fetchError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', team.id)
      .order('position', { ascending: true });

    if (fetchError) {
      console.error('❌ Erro ao buscar jogadores:', fetchError);
      return;
    }

    console.log(`✅ ${createdPlayers.length} jogadores encontrados!`);

    // Mostrar estatísticas
    const positions = {};
    createdPlayers.forEach(player => {
      positions[player.position] = (positions[player.position] || 0) + 1;
    });

    console.log('\n📊 Distribuição por posição:');
    Object.entries(positions).forEach(([position, count]) => {
      console.log(`  ${position}: ${count} jogadores`);
    });

    console.log('\n🎉 Teste concluído com sucesso na VPS!');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testVPSTeamCreation().then(() => process.exit(0)).catch(() => process.exit(1)); 