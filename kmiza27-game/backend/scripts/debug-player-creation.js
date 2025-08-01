const { getSupabaseClient } = require('../config/supabase-connection');

async function debugPlayerCreation() {
  try {
    console.log('🔍 Debugando criação de jogadores...');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Verificar se a tabela youth_players existe e está acessível
    console.log('📋 Verificando tabela youth_players...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('youth_players')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela youth_players:', tableError);
      return;
    }
    console.log('✅ Tabela youth_players acessível');
    
    // 2. Verificar estrutura da tabela
    console.log('📋 Verificando estrutura da tabela...');
    const { data: samplePlayer, error: sampleError } = await supabase
      .from('youth_players')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Erro ao buscar jogador de exemplo:', sampleError);
    } else if (samplePlayer && samplePlayer.length > 0) {
      console.log('✅ Estrutura da tabela OK');
      console.log('📊 Campos disponíveis:', Object.keys(samplePlayer[0]));
    }
    
    // 3. Testar inserção de um jogador simples
    console.log('📋 Testando inserção de jogador...');
    const testPlayer = {
      team_id: '58ed429e-b391-4fc3-baf4-f1fa10306abf', // ID do time criado anteriormente
      name: 'Jogador Teste Debug',
      position: 'Goleiro',
      date_of_birth: '2000-01-01',
      nationality: 'Brasil',
      attributes: {
        pace: 50,
        shooting: 30,
        passing: 40,
        dribbling: 30,
        defending: 80,
        physical: 75
      },
      potential: {
        pace: 55,
        shooting: 35,
        passing: 45,
        dribbling: 35,
        defending: 85,
        physical: 80
      },
      status: 'contracted',
      contract_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    
    const { data: insertedPlayer, error: insertError } = await supabase
      .from('youth_players')
      .insert(testPlayer)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir jogador de teste:', insertError);
      console.error('📝 Detalhes do erro:', insertError.message);
      console.error('📝 Código do erro:', insertError.code);
      console.error('📝 Detalhes:', insertError.details);
      return;
    }
    
    console.log('✅ Jogador de teste inserido com sucesso:', insertedPlayer.id);
    
    // 4. Verificar se o jogador foi realmente inserido
    const { data: verifyPlayer, error: verifyError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('id', insertedPlayer.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar jogador inserido:', verifyError);
    } else {
      console.log('✅ Jogador verificado:', verifyPlayer.name);
    }
    
    // 5. Contar jogadores do time
    const { data: teamPlayers, error: countError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', '58ed429e-b391-4fc3-baf4-f1fa10306abf');
    
    if (countError) {
      console.error('❌ Erro ao contar jogadores:', countError);
    } else {
      console.log(`✅ Time tem ${teamPlayers.length} jogadores`);
    }
    
  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

debugPlayerCreation().then(() => process.exit(0)).catch(() => process.exit(1)); 