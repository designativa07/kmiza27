const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAutoEnrollment() {
  try {
    console.log('🧪 Testando inscrição automática de times...');
    
    // 1. Verificar competições disponíveis
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams')
      .eq('status', 'active')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log('📊 Competições disponíveis:');
    competitions.forEach(comp => {
      console.log(`  - ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    // 2. Criar um time de teste
    const testTeamData = {
      name: `Time Teste ${Date.now()}`,
      short_name: `TT${Date.now()}`,
      stadium_name: 'Estádio Teste',
      stadium_capacity: 15000,
      colors: {
        primary: '#FF0000',
        secondary: '#0000FF'
      },
      budget: 1000000,
      reputation: 50,
      fan_base: 1000
    };
    
    console.log('\n🏗️ Criando time de teste...');
    
    // Buscar ou criar usuário
    const { data: users, error: userError } = await supabase
      .from('game_users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    const userId = users[0].id;
    console.log(`👤 Usando usuário: ${userId}`);
    
    // Criar time
    const { data: team, error: teamError } = await supabase
      .from('game_teams')
      .insert({
        ...testTeamData,
        owner_id: userId,
        team_type: 'user_created',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (teamError) {
      console.error('❌ Erro ao criar time:', teamError);
      return;
    }
    
    console.log(`✅ Time criado: ${team.name} (ID: ${team.id})`);
    
    // 3. Aguardar um pouco para o processo automático
    console.log('\n⏳ Aguardando processamento automático...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Verificar se o time foi inscrito automaticamente
    const { data: enrollments, error: enrollError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_competitions!inner(id, name, tier, current_teams, max_teams)
      `)
      .eq('team_id', team.id);
    
    if (enrollError) {
      console.error('❌ Erro ao verificar inscrições:', enrollError);
      return;
    }
    
    if (enrollments && enrollments.length > 0) {
      console.log('✅ Time inscrito automaticamente!');
      enrollments.forEach(enrollment => {
        const comp = enrollment.game_competitions;
        console.log(`  - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams}`);
      });
    } else {
      console.log('❌ Time não foi inscrito automaticamente');
    }
    
    // 5. Verificar se foram criadas partidas
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('competition_id', enrollments[0]?.game_competitions.id);
    
    if (matchesError) {
      console.error('❌ Erro ao verificar partidas:', matchesError);
      return;
    }
    
    console.log(`\n⚽ Partidas criadas: ${matches?.length || 0}`);
    if (matches && matches.length > 0) {
      console.log('  Primeiras 3 partidas:');
      matches.slice(0, 3).forEach(match => {
        console.log(`    - ${match.home_team_name} vs ${match.away_team_name} (${match.status})`);
      });
    }
    
    // 6. Verificar standings
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select('*')
      .eq('team_id', team.id);
    
    if (standingsError) {
      console.error('❌ Erro ao verificar standings:', standingsError);
      return;
    }
    
    console.log(`\n📈 Entradas na classificação: ${standings?.length || 0}`);
    
    // 7. Limpar - deletar o time de teste
    console.log('\n🧹 Limpando teste...');
    const { error: deleteError } = await supabase
      .from('game_teams')
      .delete()
      .eq('id', team.id);
    
    if (deleteError) {
      console.error('❌ Erro ao deletar time de teste:', deleteError);
    } else {
      console.log('✅ Time de teste deletado');
    }
    
    console.log('\n🎉 Teste de inscrição automática concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAutoEnrollment(); 