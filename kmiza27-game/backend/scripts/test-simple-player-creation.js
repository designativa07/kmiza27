const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function testSimplePlayerCreation() {
  console.log('🧪 TESTE SIMPLES DE CRIAÇÃO DE JOGADORES');
  console.log('=========================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estrutura da tabela
    console.log('📋 1. Verificando estrutura da tabela...');
    
    const { data: samplePlayer, error: sampleError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao verificar tabela:', sampleError.message);
      return;
    }

    if (samplePlayer && samplePlayer.length > 0) {
      console.log('✅ Estrutura da tabela:');
      Object.entries(samplePlayer[0]).forEach(([key, value]) => {
        console.log(`   • ${key}: ${value} (${typeof value})`);
      });
    }

    // 2. Tentar criar um jogador simples
    console.log('\n⚽ 2. Tentando criar um jogador simples...');
    
    const simplePlayer = {
      name: 'Teste Jogador',
      position: 'GK',
      age: 25,
      nationality: 'Brasil',
      team_id: '108169aa-feda-419a-bbd8-855bb796f43c', // Real Brasília
      
      // Atributos básicos
      pace: 70,
      shooting: 50,
      passing: 60,
      dribbling: 40,
      defending: 80,
      physical: 75,
      
      // Outros campos obrigatórios
      market_value: 50000,
      salary: 2500,
      morale: 80,
      fitness: 85,
      form: 7,
      
      games_played: 0,
      goals_scored: 0,
      assists: 0,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Dados do jogador a ser criado:');
    Object.entries(simplePlayer).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    const { data: createdPlayer, error: createError } = await supabase
      .from('game_players')
      .insert(simplePlayer)
      .select();

    if (createError) {
      console.log('❌ Erro ao criar jogador:', createError.message);
      
      // Tentar identificar o campo problemático
      if (createError.message.includes('character varying')) {
        console.log('🔍 Erro de VARCHAR - verificando campos de texto...');
        
        // Verificar cada campo de texto
        const textFields = ['name', 'position', 'nationality'];
        textFields.forEach(field => {
          if (simplePlayer[field]) {
            console.log(`   • ${field}: "${simplePlayer[field]}" (${simplePlayer[field].length} caracteres)`);
          }
        });
      }
    } else {
      console.log('✅ Jogador criado com sucesso!');
      console.log('📊 Dados do jogador criado:', createdPlayer);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testSimplePlayerCreation();
