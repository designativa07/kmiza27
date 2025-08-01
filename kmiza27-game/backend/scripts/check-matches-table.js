const { getSupabaseClient } = require('../config/supabase-connection');

async function checkMatchesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela game_matches...');
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar se a tabela existe tentando buscar dados
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .limit(1);
    
    if (matchesError) {
      console.log('❌ Tabela game_matches não existe ou não está acessível');
      console.log('Erro:', matchesError.message);
      return;
    }
    
    console.log('✅ Tabela game_matches existe e está acessível');
    
    if (!matches || matches.length === 0) {
      console.log('📝 Tabela está vazia - não há partidas para analisar');
      return;
    }
    
    // Pegar a primeira partida para ver as colunas
    const sampleMatch = matches[0];
    
    console.log('\n📋 Colunas disponíveis na tabela game_matches:');
    Object.keys(sampleMatch).forEach(column => {
      console.log(`  - ${column}: ${typeof sampleMatch[column]}`);
    });
    
    // Verificar se finished_at existe
    const hasFinishedAt = 'finished_at' in sampleMatch;
    
    if (!hasFinishedAt) {
      console.log('\n❌ PROBLEMA: Coluna finished_at não existe!');
      console.log('💡 Solução: Execute o script fix-game-matches-complete.sql');
      
      // Verificar se há outras colunas de data
      const dateColumns = Object.keys(sampleMatch).filter(col => 
        col.includes('date') || col.includes('at') || col.includes('time')
      );
      console.log(`\n📅 Colunas de data encontradas: ${dateColumns.join(', ')}`);
    } else {
      console.log('\n✅ Coluna finished_at existe');
    }
    
    // Buscar mais partidas para mostrar exemplos
    const { data: allMatches, error: allMatchesError } = await supabase
      .from('game_matches')
      .select('id, home_team_name, away_team_name, status, home_score, away_score')
      .limit(5);
    
    if (allMatchesError) {
      console.error('❌ Erro ao buscar partidas:', allMatchesError);
      return;
    }
    
    console.log(`\n📊 Encontradas ${allMatches.length} partidas:`);
    allMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.home_team_name} vs ${match.away_team_name} (${match.status}) - ${match.home_score}x${match.away_score}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkMatchesTable(); 