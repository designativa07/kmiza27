const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dados de exemplo para jogadores
const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
const NAMES = [
  'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'André Lima',
  'Rafael Pereira', 'Lucas Ferreira', 'Gabriel Almeida', 'Matheus Rodrigues', 'Thiago Cardoso',
  'Bruno Martins', 'Felipe Souza', 'Ricardo Barbosa', 'Marcelo Rocha', 'Diego Nascimento',
  'Alexandre Mendes', 'Roberto Castro', 'Daniel Gomes', 'Eduardo Santos', 'Fernando Lima'
];

function generateRandomAttributes() {
  return {
    pace: Math.floor(Math.random() * 40) + 30,      // 30-70
    shooting: Math.floor(Math.random() * 40) + 30,  // 30-70
    passing: Math.floor(Math.random() * 40) + 30,   // 30-70
    dribbling: Math.floor(Math.random() * 40) + 30, // 30-70
    defending: Math.floor(Math.random() * 40) + 30, // 30-70
    physical: Math.floor(Math.random() * 40) + 30   // 30-70
  };
}

function generateRandomPotential() {
  return {
    pace: Math.floor(Math.random() * 50) + 40,      // 40-90
    shooting: Math.floor(Math.random() * 50) + 40,  // 40-90
    passing: Math.floor(Math.random() * 50) + 40,   // 40-90
    dribbling: Math.floor(Math.random() * 50) + 40, // 40-90
    defending: Math.floor(Math.random() * 50) + 40, // 40-90
    physical: Math.floor(Math.random() * 50) + 40   // 40-90
  };
}

function generateRandomDate() {
  const start = new Date(1990, 0, 1);
  const end = new Date(2005, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function populateAITeams() {
  try {
    console.log('🚀 Iniciando população dos times da IA...');

    // 1. Buscar todos os times da IA
    const { data: aiTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('is_user_team', false);

    if (teamsError || !aiTeams) {
      console.error('❌ Erro ao buscar times da IA:', teamsError);
      return;
    }

    console.log(`📋 Encontrados ${aiTeams.length} times da IA para popular`);

    for (const team of aiTeams) {
      console.log(`\n🏟️  Populando time: ${team.name}`);
      
      // 2. Criar 23 jogadores profissionais para cada time
      const proPlayers = [];
      for (let i = 0; i < 23; i++) {
        const attributes = generateRandomAttributes();
        const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (i + 1);
        const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        const marketValue = Math.floor(Math.random() * 50000) + 10000; // 10k - 60k
        const salary = Math.floor(Math.random() * 2000) + 500; // 500 - 2500
        const currentAbility = Math.floor((attributes.pace + attributes.shooting + attributes.passing + 
                                         attributes.dribbling + attributes.defending + attributes.physical) / 6);

        proPlayers.push({
          name,
          position,
          age: Math.floor(Math.random() * 15) + 18, // 18-33 anos
          nationality: 'Brasil',
          team_id: team.id,
          // Atributos individuais (que já existem na tabela)
          pace: attributes.pace,
          shooting: attributes.shooting,
          passing: attributes.passing,
          dribbling: attributes.dribbling,
          defending: attributes.defending,
          physical: attributes.physical,
          // Overall (usando current_ability que já existe)
          current_ability: currentAbility,
          potential: currentAbility + Math.floor(Math.random() * 20), // Potencial um pouco maior
          // Dados de mercado
          market_value: marketValue,
          salary,
          wage: salary, // Coluna alternativa para salário
          // Status
          is_transfer_listed: false,
          asking_price: null,
          // Outros campos obrigatórios
          morale: Math.floor(Math.random() * 20) + 70, // 70-90
          fitness: Math.floor(Math.random() * 20) + 70, // 70-90
          form: Math.floor(Math.random() * 20) + 70, // 70-90
          games_played: 0,
          goals_scored: 0,
          assists: 0
        });
      }

      // 3. Inserir jogadores profissionais
      const { error: proError } = await supabase
        .from('game_players')
        .insert(proPlayers);

      if (proError) {
        console.error(`❌ Erro ao inserir jogadores profissionais para ${team.name}:`, proError);
      } else {
        console.log(`✅ ${proPlayers.length} jogadores profissionais criados para ${team.name}`);
      }

      // 4. Criar 23 jogadores da base para cada time
      const youthPlayers = [];
      for (let i = 0; i < 23; i++) {
        const attributes = generateRandomAttributes();
        const potential = generateRandomPotential();
        const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' Jr.' + (i + 1);
        const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        const marketValue = Math.floor(Math.random() * 25000) + 5000; // 5k - 30k

        youthPlayers.push({
          name,
          position,
          date_of_birth: generateRandomDate().toISOString().split('T')[0],
          nationality: 'Brasil',
          team_id: team.id,
          attributes,
          potential,
          market_value: marketValue
        });
      }

      // 5. Inserir jogadores da base
      const { error: youthError } = await supabase
        .from('youth_players')
        .insert(youthPlayers);

      if (youthError) {
        console.error(`❌ Erro ao inserir jogadores da base para ${team.name}:`, youthError);
      } else {
        console.log(`✅ ${youthPlayers.length} jogadores da base criados para ${team.name}`);
      }
    }

    console.log('\n🎉 População dos times da IA concluída!');
    console.log('💡 Agora a IA do mercado deve funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro durante a população:', error);
  }
}

// Executar a população
populateAITeams();
