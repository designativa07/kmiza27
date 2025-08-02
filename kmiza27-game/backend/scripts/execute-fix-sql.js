const { getSupabaseClient } = require('../config/supabase-connection');

/**
 * 🔧 EXECUTAR CORREÇÃO SQL DA TABELA game_competition_matches
 * 
 * Este script executa os comandos SQL necessários para corrigir a estrutura
 * da tabela game_competition_matches via Supabase RPC.
 */

async function executeFixSQL() {
  try {
    console.log('🔧 EXECUTANDO CORREÇÃO SQL');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. ADICIONAR COLUNA round_number
    console.log('\n📝 1. Adicionando coluna round_number...');
    try {
      const { error: addRoundError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE game_competition_matches ADD COLUMN IF NOT EXISTS round_number INTEGER;'
      });
      
      if (addRoundError) {
        console.log(`   ❌ Erro ao adicionar round_number: ${addRoundError.message}`);
      } else {
        console.log('   ✅ Coluna round_number adicionada');
      }
    } catch (error) {
      console.log(`   ⚠️ Erro ao executar SQL (pode ser que a coluna já exista): ${error.message}`);
    }
    
    // 2. CRIAR ÍNDICE PARA PERFORMANCE
    console.log('\n📋 2. Criando índice para performance...');
    try {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: 'CREATE INDEX IF NOT EXISTS idx_competition_matches_round ON game_competition_matches(competition_id, round_number);'
      });
      
      if (indexError) {
        console.log(`   ❌ Erro ao criar índice: ${indexError.message}`);
      } else {
        console.log('   ✅ Índice criado');
      }
    } catch (error) {
      console.log(`   ⚠️ Erro ao criar índice (pode já existir): ${error.message}`);
    }
    
    // 3. VERIFICAR ESTRUTURA FINAL
    console.log('\n📋 3. Verificando estrutura final...');
    const { data: finalStructure, error: structureError } = await supabase
      .from('game_competition_matches')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log(`   ❌ Erro ao verificar estrutura: ${structureError.message}`);
    } else if (finalStructure && finalStructure.length > 0) {
      const columns = Object.keys(finalStructure[0]);
      console.log('   📊 Colunas finais:');
      columns.forEach(col => {
        console.log(`      - ${col}: ${typeof finalStructure[0][col]}`);
      });
      
      // Verificar se round_number existe
      if ('round_number' in finalStructure[0]) {
        console.log('   ✅ Coluna round_number está disponível');
      } else {
        console.log('   ❌ Coluna round_number não está disponível');
      }
    }
    
    // 4. TESTAR INSERÇÃO
    console.log('\n🧪 4. Testando inserção...');
    await testInsertion(supabase);
    
    console.log('\n✅ CORREÇÃO SQL CONCLUÍDA!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. Execute novamente o script de reformulação');
    console.log('   2. Teste a criação de calendário');
    console.log('   3. Verifique se novos times são inscritos na Série D');
    
  } catch (error) {
    console.error('❌ Erro na execução:', error);
  }
}

async function testInsertion(supabase) {
  try {
    // Buscar uma competição válida
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id')
      .limit(1);
    
    if (compError || !competitions || competitions.length === 0) {
      console.log('   ❌ Nenhuma competição encontrada para teste');
      return;
    }
    
    const competitionId = competitions[0].id;
    
    // Buscar dois times válidos
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(2);
    
    if (teamsError || !teams || teams.length < 2) {
      console.log('   ❌ Times insuficientes para teste');
      return;
    }
    
    // Tentar inserir uma partida de teste
    const { data: testMatch, error: insertError } = await supabase
      .from('game_competition_matches')
      .insert({
        competition_id: competitionId,
        home_team_id: teams[0].id,
        away_team_id: teams[1].id,
        home_team_name: teams[0].name,
        away_team_name: teams[1].name,
        match_date: new Date().toISOString(),
        round_number: 1,
        status: 'scheduled'
      })
      .select();
    
    if (insertError) {
      console.log(`   ❌ Erro ao testar inserção: ${insertError.message}`);
    } else {
      console.log('   ✅ Inserção de teste bem-sucedida');
      
      // Remover partida de teste
      if (testMatch && testMatch.length > 0) {
        await supabase
          .from('game_competition_matches')
          .delete()
          .eq('id', testMatch[0].id);
        
        console.log('   ✅ Partida de teste removida');
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no teste: ${error.message}`);
  }
}

// Executar correção
executeFixSQL(); 