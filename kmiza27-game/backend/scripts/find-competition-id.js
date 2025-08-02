const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔍 BUSCANDO ID DA SÉRIE D');
console.log('=' .repeat(30));

async function findCompetitionId() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('id, name, tier, status')
      .eq('tier', 4)
      .eq('status', 'active');

    if (error) {
      console.error('❌ Erro ao buscar competições:', error);
      return;
    }

    console.log('📊 Competições da Série D encontradas:');
    competitions.forEach(comp => {
      console.log(`   - ID: ${comp.id}`);
      console.log(`   - Nome: ${comp.name}`);
      console.log(`   - Tier: ${comp.tier}`);
      console.log(`   - Status: ${comp.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro durante a busca:', error);
  }
}

findCompetitionId(); 