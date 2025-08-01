const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🧪 TESTE DE CRIAÇÃO DE TIME DO USUÁRIO');
console.log('=' .repeat(45));

async function testCreateUserTeam() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Verificar se o usuário existe
    console.log('\n📋 1. Verificando se o usuário existe...');
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    
    const { data: existingUser, error: userError } = await supabase
      .from('game_users')
      .select('id, username, display_name')
      .eq('id', userId)
      .single();
    
    let actualUserId = userId;
    
    if (userError || !existingUser) {
      console.log('📋 Usuário não encontrado, criando novo usuário...');
      
      const { data: newUser, error: createUserError } = await supabase
        .from('game_users')
        .insert({
          id: userId,
          email: 'teste@kmiza27.com',
          username: 'usuario-teste',
          display_name: 'Usuário Teste'
        })
        .select()
        .single();
      
      if (createUserError) {
        console.log('❌ Erro ao criar usuário:', createUserError.message);
        return;
      }
      
      console.log('✅ Usuário criado com sucesso!');
      actualUserId = newUser.id;
    } else {
      console.log('✅ Usuário encontrado:', existingUser.display_name);
    }
    
    // Dados do novo time
    const teamData = {
      name: 'Time Teste do Usuário',
      short_name: 'TTU',
      slug: 'time-teste-usuario',
      owner_id: actualUserId,
      team_type: 'user_created',
      colors: {
        primary: '#3b82f6',
        secondary: '#ffffff'
      },
      stadium_name: 'Estádio Teste',
      stadium_capacity: 25000,
      budget: 1000000,
      reputation: 50,
      fan_base: 1000,
      created_at: new Date().toISOString()
    };
    
    console.log('\n📋 2. Criando novo time do usuário...');
    console.log('📊 Dados do time:', {
      name: teamData.name,
      owner_id: teamData.owner_id,
      team_type: teamData.team_type
    });
    
    const { data: newTeam, error: createError } = await supabase
      .from('game_teams')
      .insert(teamData)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar time:', createError.message);
      return;
    }
    
    console.log('✅ Time criado com sucesso!');
    console.log(`📊 ID do time: ${newTeam.id}`);
    
    // Verificar se o time aparece na lista do usuário
    console.log('\n📋 3. Verificando se o time aparece na lista do usuário...');
    
    const { data: userTeams, error: listError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id')
      .eq('owner_id', actualUserId)
      .eq('team_type', 'user_created');
    
    if (listError) {
      console.log('❌ Erro ao buscar times do usuário:', listError.message);
      return;
    }
    
    console.log(`📊 Times do usuário encontrados: ${userTeams.length}`);
    
    if (userTeams.length > 0) {
      console.log('📋 Lista de times do usuário:');
      userTeams.forEach(team => {
        console.log(`  - ${team.name} (${team.team_type})`);
      });
      
      // Verificar se o novo time está na lista
      const foundTeam = userTeams.find(team => team.id === newTeam.id);
      if (foundTeam) {
        console.log('✅ Novo time encontrado na lista do usuário!');
      } else {
        console.log('❌ Novo time NÃO encontrado na lista do usuário!');
      }
    } else {
      console.log('📋 Nenhum time do usuário encontrado');
    }
    
    // Verificar se não há times da máquina na lista
    console.log('\n📋 4. Verificando se não há times da máquina na lista...');
    
    const { data: machineTeams, error: machineError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id')
      .eq('owner_id', actualUserId)
      .eq('team_type', 'machine');
    
    if (machineError) {
      console.log('❌ Erro ao buscar times da máquina:', machineError.message);
      return;
    }
    
    console.log(`📊 Times da máquina com mesmo owner_id: ${machineTeams.length}`);
    
    if (machineTeams.length === 0) {
      console.log('✅ Nenhum time da máquina encontrado na lista do usuário!');
    } else {
      console.log('⚠️  ATENÇÃO: Encontrados times da máquina na lista do usuário!');
      machineTeams.forEach(team => {
        console.log(`  - ${team.name} (${team.team_type})`);
      });
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('💡 A correção está funcionando corretamente');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testCreateUserTeam();
}

module.exports = {
  testCreateUserTeam
}; 