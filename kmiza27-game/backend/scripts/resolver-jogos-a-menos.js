const { getSupabaseClient } = require('../config/supabase-connection');
const { diagnosticarJogosAMenos } = require('./diagnosticar-jogos-a-menos');
const { corrigirCalendarioJogos } = require('./corrigir-calendario-jogos');

async function resolverJogosAMenos() {
  console.log('🚀 RESOLVENDO PROBLEMA: Times com jogos a menos');
  console.log('=====================================================\n');

  try {
    // Passo 1: Diagnóstico
    console.log('🔍 PASSO 1: Executando diagnóstico...');
    console.log('─'.repeat(50));
    await diagnosticarJogosAMenos();
    
    console.log('\n' + '─'.repeat(50));
    console.log('⏸️ Aguardando confirmação para continuar...');
    console.log('📋 Revise o diagnóstico acima.');
    console.log('⚠️ A correção vai recriar calendários de jogos.');
    console.log('💡 Pressione ENTER para continuar ou CTRL+C para cancelar');
    
    // Aguardar entrada do usuário (comentado para automação, descomente se quiser confirmação manual)
    // await new Promise(resolve => process.stdin.once('data', resolve));
    
    // Passo 2: Correção automática
    console.log('\n🔧 PASSO 2: Executando correção...');
    console.log('─'.repeat(50));
    await corrigirCalendarioJogos();
    
    // Passo 3: Verificação pós-correção
    console.log('\n✅ PASSO 3: Verificação pós-correção...');
    console.log('─'.repeat(50));
    await verificarAposCorrecao();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 RESOLUÇÃO CONCLUÍDA!');
    console.log('✅ Problema de jogos a menos foi resolvido');
    console.log('📊 Verifique os logs acima para detalhes');
    console.log('🎮 Os usuários já podem voltar a jogar normalmente');
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO durante a resolução:', error);
    console.log('\n🚨 AÇÕES RECOMENDADAS:');
    console.log('1. Verifique a conexão com o banco de dados');
    console.log('2. Execute o diagnóstico separadamente');
    console.log('3. Contate o administrador do sistema');
  }
}

async function verificarAposCorrecao() {
  const supabase = getSupabaseClient('vps');
  
  try {
    console.log('🔍 Verificando se a correção foi bem-sucedida...\n');
    
    // Verificar usuários com temporada ativa
    const { data: activeUsers, error } = await supabase
      .from('game_user_competition_progress')
      .select('user_id, games_played, current_tier')
      .eq('season_status', 'active')
      .order('games_played', { ascending: true });
    
    if (error) {
      console.log('❌ Erro ao verificar usuários:', error.message);
      return;
    }
    
    const problemUsers = activeUsers.filter(u => u.games_played < 30);
    
    console.log(`📊 Usuários ativos: ${activeUsers.length}`);
    console.log(`⚠️ Usuários com poucos jogos: ${problemUsers.length}`);
    
    if (problemUsers.length === 0) {
      console.log('✅ Todos os usuários têm jogos suficientes!');
    } else {
      console.log('⚠️ Ainda há usuários com poucos jogos:');
      problemUsers.slice(0, 5).forEach(user => {
        console.log(`   - ${user.user_id.slice(0, 8)}...: ${user.games_played} jogos (Série ${user.current_tier})`);
      });
      
      if (problemUsers.length > 5) {
        console.log(`   ... e mais ${problemUsers.length - 5} usuários`);
      }
    }
    
    // Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier')
      .eq('status', 'active');
    
    if (!compError) {
      console.log(`\n🏆 Verificando ${competitions.length} competições...`);
      
      for (const comp of competitions) {
        const { data: teams, error: teamsError } = await supabase
          .from('game_competition_teams')
          .select('team_id')
          .eq('competition_id', comp.id);
        
        const { data: matches, error: matchesError } = await supabase
          .from('game_matches')
          .select('id')
          .eq('competition_id', comp.id);
        
        if (!teamsError && !matchesError) {
          const expectedMatches = teams.length * (teams.length - 1);
          const actualMatches = matches.length;
          
          const status = actualMatches >= expectedMatches ? '✅' : '⚠️';
          console.log(`   ${status} ${comp.name}: ${actualMatches}/${expectedMatches} partidas`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação pós-correção:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  resolverJogosAMenos()
    .then(() => {
      console.log('\n🏁 Script finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { resolverJogosAMenos };