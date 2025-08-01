const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeamCreation() {
  try {
    console.log('🧪 Testando criação de time com jogadores...');
    
    // 1. Criar um time via API
    const teamData = {
      name: 'Time Teste Jogadores',
      short_name: 'TTJ',
      colors: {
        primary: '#FF0000',
        secondary: '#0000FF'
      },
      stadium_name: 'Estádio Teste',
      stadium_capacity: 15000,
      budget: 2000000,
      reputation: 60,
      fan_base: 8000
    };

    console.log('📋 Criando time...');
    const response = await fetch('http://localhost:3004/api/v1/game-teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        ...teamData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na criação do time: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Time criado:', result.data.name);
    console.log('🆔 ID do time:', result.data.id);

    // 2. Verificar se os jogadores foram criados
    console.log('📋 Verificando jogadores...');
    const { data: players, error: playersError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', result.data.id);

    if (playersError) {
      console.error('❌ Erro ao buscar jogadores:', playersError);
      return;
    }

    console.log(`✅ ${players.length} jogadores encontrados!`);

    // 3. Mostrar estatísticas dos jogadores
    const positions = {};
    players.forEach(player => {
      positions[player.position] = (positions[player.position] || 0) + 1;
    });

    console.log('📊 Distribuição por posição:');
    Object.entries(positions).forEach(([position, count]) => {
      console.log(`  ${position}: ${count} jogadores`);
    });

    // 4. Mostrar alguns jogadores como exemplo
    console.log('\n👥 Exemplos de jogadores:');
    players.slice(0, 5).forEach(player => {
      console.log(`  ${player.name} - ${player.position} (${player.attributes.pace}/${player.attributes.shooting}/${player.attributes.passing})`);
    });

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testTeamCreation().then(() => process.exit(0)).catch(() => process.exit(1)); 