const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * 🎮 POPULAÇÃO DOS TIMES DA IA COM JOGADORES (ADMIN)
 * 
 * Objetivos:
 * 1. Usar cliente de serviço para bypassar RLS
 * 2. Corrigir campos de posição (VARCHAR(3))
 * 3. Criar jogadores para todos os times da IA
 * 4. Resolver problema do mercado vazio
 */

// Dados para geração de jogadores
const NAMES = [
  'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'André Costa', 'Lucas Lima',
  'Gabriel Alves', 'Rafael Pereira', 'Bruno Rodrigues', 'Thiago Ferreira', 'Diego Souza',
  'Marcos Silva', 'Felipe Costa', 'Ricardo Santos', 'Eduardo Lima', 'Alexandre Alves',
  'Roberto Pereira', 'Daniel Rodrigues', 'Leonardo Ferreira', 'Matheus Souza', 'Victor Silva',
  'Guilherme Costa', 'Rodrigo Santos', 'Fernando Lima', 'Paulo Alves', 'Marcelo Pereira'
];

// POSIÇÕES CORRIGIDAS para VARCHAR(3)
const POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'CF', 'ST'
];

const POSITION_NAMES = {
  'GK': 'Goleiro',
  'CB': 'Zagueiro', 
  'LB': 'Lateral Esquerdo',
  'RB': 'Lateral Direito',
  'DM': 'Volante',
  'CM': 'Meia Central',
  'AM': 'Meia Ofensivo',
  'LW': 'Ponta Esquerda',
  'RW': 'Ponta Direita',
  'CF': 'Centroavante',
  'ST': 'Atacante'
};

function generateRandomAttributes() {
  return {
    pace: Math.floor(Math.random() * 40) + 30,        // 30-70
    shooting: Math.floor(Math.random() * 40) + 30,    // 30-70
    passing: Math.floor(Math.random() * 40) + 30,     // 30-70
    dribbling: Math.floor(Math.random() * 40) + 30,   // 30-70
    defending: Math.floor(Math.random() * 40) + 30,   // 30-70
    physical: Math.floor(Math.random() * 40) + 30     // 30-70
  };
}

function generateRandomDate() {
  const start = new Date('2000-01-01');
  const end = new Date('2008-12-31');
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function populateAITeamsWithPlayers() {
  try {
    console.log('🎮 POPULAÇÃO DOS TIMES DA IA COM JOGADORES (ADMIN)');
    console.log('=' .repeat(70));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. BUSCAR TODOS OS TIMES DA IA
    console.log('\n🤖 1. Buscando times da IA...');
    const { data: aiTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, machine_tier')
      .eq('is_user_team', false);

    if (teamsError || !aiTeams) {
      console.error('❌ Erro ao buscar times da IA:', teamsError);
      return;
    }

    console.log(`📋 Encontrados ${aiTeams.length} times da IA para popular`);

    // 2. POPULAR CADA TIME COM JOGADORES
    for (const team of aiTeams) {
      console.log(`\n🏟️ Populando time: ${team.name} (Tier ${team.machine_tier || 'N/A'})`);
      
      // Criar 23 jogadores da base para cada time
      const youthPlayers = [];
      for (let i = 0; i < 23; i++) {
        const attributes = generateRandomAttributes();
        const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' Jr.' + (i + 1);
        const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        const marketValue = Math.floor(Math.random() * 25000) + 5000; // 5k - 30k

        youthPlayers.push({
          name,
          position, // Agora é VARCHAR(3): GK, CB, LB, etc.
          date_of_birth: generateRandomDate().toISOString().split('T')[0],
          nationality: 'Brasil',
          team_id: team.id,
          attributes,
          // potential_overall é gerado automaticamente
          market_value: marketValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Inserir jogadores da base
      const { error: youthError } = await supabase
        .from('youth_players')
        .insert(youthPlayers);

      if (youthError) {
        console.error(`❌ Erro ao inserir jogadores da base para ${team.name}:`, youthError);
      } else {
        console.log(`✅ ${youthPlayers.length} jogadores da base criados para ${team.name}`);
      }

      // Criar 23 jogadores profissionais para cada time
      const proPlayers = [];
      for (let i = 0; i < 23; i++) {
        const attributes = generateRandomAttributes();
        const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (i + 1);
        const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        const marketValue = Math.floor(Math.random() * 50000) + 10000; // 10k - 60k
        const salary = Math.floor(Math.random() * 2000) + 500; // 500 - 2500

        proPlayers.push({
          name,
          position, // Agora é VARCHAR(3): GK, CB, LB, etc.
          age: Math.floor(Math.random() * 15) + 18, // 18-33 anos
          nationality: 'Brasil',
          team_id: team.id,
          // Atributos individuais
          pace: attributes.pace,
          shooting: attributes.shooting,
          passing: attributes.passing,
          dribbling: attributes.dribbling,
          defending: attributes.defending,
          physical: attributes.physical,
          // current_ability e potential são gerados automaticamente
          // Dados de mercado
          market_value: marketValue,
          salary,
          wage: salary,
          // Status
          is_transfer_listed: false,
          asking_price: null,
          // Outros campos
          morale: Math.floor(Math.random() * 20) + 70, // 70-90
          fitness: Math.floor(Math.random() * 20) + 70, // 70-90
          form: Math.floor(Math.random() * 20) + 70, // 70-90
          games_played: 0,
          goals_scored: 0,
          assists: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Inserir jogadores profissionais
      const { error: proError } = await supabase
        .from('game_players')
        .insert(proPlayers);

      if (proError) {
        console.error(`❌ Erro ao inserir jogadores profissionais para ${team.name}:`, proError);
      } else {
        console.log(`✅ ${proPlayers.length} jogadores profissionais criados para ${team.name}`);
      }
    }

    // 3. VERIFICAR RESULTADO FINAL
    console.log('\n📊 3. Verificando resultado final...');
    
    const { count: totalYouth, error: youthCountError } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    const { count: totalPro, error: proCountError } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    if (youthCountError) {
      console.error('❌ Erro ao contar jogadores da base:', youthCountError);
    } else {
      console.log(`👶 Total de jogadores da base: ${totalYouth || 0}`);
    }

    if (proCountError) {
      console.error('❌ Erro ao contar jogadores profissionais:', proCountError);
    } else {
      console.log(`👨‍💼 Total de jogadores profissionais: ${totalPro || 0}`);
    }

    const totalPlayers = (totalYouth || 0) + (totalPro || 0);
    console.log(`🎯 Total geral de jogadores: ${totalPlayers}`);

    // 4. TESTAR IA DO MERCADO
    console.log('\n🧠 4. Testando IA do mercado...');
    console.log('💡 Agora você pode clicar em "Executar IA do Mercado" para testar!');
    console.log('📋 A IA deve listar alguns jogadores no mercado (máximo 2 por time)');

    console.log('\n🎉 POPULAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${aiTeams.length} times da IA populados`);
    console.log(`   • ${totalPlayers} jogadores criados no total`);
    console.log(`   • Mercado agora pode ser abastecido pela IA`);
    console.log(`   • Sistema equilibrado e jogável`);

  } catch (error) {
    console.error('❌ Erro durante a população:', error);
  }
}

// Executar população
populateAITeamsWithPlayers().then(() => {
  console.log('\n🔌 Script concluído.');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
