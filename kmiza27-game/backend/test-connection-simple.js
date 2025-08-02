const { getSupabaseServiceClient } = require('./config/supabase-connection');

console.log('🔧 TESTANDO CONEXÃO COM SUPABASE');
console.log('=' .repeat(35));

async function testConnection() {
  try {
    console.log('\n📋 1. Inicializando cliente Supabase...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('✅ Cliente Supabase inicializado');
    
    console.log('\n📋 2. Testando conexão com banco de dados...');
    
    const { data, error } = await supabase
      .from('game_teams')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return;
    }
    
    console.log('✅ Conexão com banco de dados funcionando');
    
    console.log('\n📋 3. Verificando tabelas principais...');
    
    // Testar tabela de times
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(3);
    
    if (teamsError) {
      console.error('❌ Erro ao buscar times:', teamsError);
    } else {
      console.log(`✅ Tabela game_teams: ${teams.length} times encontrados`);
    }
    
    // Testar tabela de competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier')
      .limit(3);
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
    } else {
      console.log(`✅ Tabela game_competitions: ${competitions.length} competições encontradas`);
    }
    
    console.log('\n🎯 CONEXÃO TESTADA COM SUCESSO!');
    console.log('✅ Cliente Supabase funcionando');
    console.log('✅ Banco de dados acessível');
    console.log('✅ Tabelas principais verificadas');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testConnection(); 