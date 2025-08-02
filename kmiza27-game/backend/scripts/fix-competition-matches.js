const { getSupabaseClient } = require('../config/supabase-connection');

/**
 * 🔧 CORREÇÃO DA TABELA game_competition_matches
 * 
 * Adiciona colunas necessárias para o sistema de calendário:
 * - round_number: Número da rodada
 * - home_team_name: Nome do time da casa
 * - away_team_name: Nome do time visitante
 */

async function fixCompetitionMatchesTable() {
  try {
    console.log('🔧 CORREÇÃO DA TABELA game_competition_matches');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR SE A TABELA EXISTE
    console.log('\n📋 1. Verificando se a tabela existe...');
    const { data: tableExists, error: checkError } = await supabase
      .from('game_competition_matches')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log(`❌ Tabela não existe ou não está acessível: ${checkError.message}`);
      console.log('🔧 Criando tabela game_competition_matches...');
      
      // Criar tabela se não existir
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS game_competition_matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
          home_team_id UUID NOT NULL REFERENCES game_teams(id),
          away_team_id UUID NOT NULL REFERENCES game_teams(id),
          home_team_name VARCHAR(255) NOT NULL,
          away_team_name VARCHAR(255) NOT NULL,
          home_score INTEGER DEFAULT 0,
          away_score INTEGER DEFAULT 0,
          match_date TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'cancelled')),
          round_number INTEGER,
          highlights TEXT[] DEFAULT '{}',
          stats JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      console.log('📄 Execute este SQL no Supabase Studio:');
      console.log(createTableSQL);
      return;
    }
    
    console.log('✅ Tabela game_competition_matches existe');
    
    // 2. VERIFICAR ESTRUTURA ATUAL
    console.log('\n📋 2. Verificando estrutura atual...');
    const { data: sampleMatch, error: sampleError } = await supabase
      .from('game_competition_matches')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log(`❌ Erro ao verificar estrutura: ${sampleError.message}`);
      return;
    }
    
    if (sampleMatch && sampleMatch.length > 0) {
      const columns = Object.keys(sampleMatch[0]);
      console.log('📊 Colunas atuais:');
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof sampleMatch[0][col]}`);
      });
    }
    
    // 3. ADICIONAR COLUNAS NECESSÁRIAS
    console.log('\n🔧 3. Adicionando colunas necessárias...');
    
    // Verificar se round_number existe
    if (!sampleMatch || !sampleMatch[0] || !('round_number' in sampleMatch[0])) {
      console.log('   📝 Adicionando coluna round_number...');
      
      // Nota: Não podemos adicionar colunas via Supabase client
      // O usuário precisa executar o SQL manualmente
      console.log('📄 Execute este SQL no Supabase Studio:');
      console.log('ALTER TABLE game_competition_matches ADD COLUMN IF NOT EXISTS round_number INTEGER;');
    } else {
      console.log('   ✅ Coluna round_number já existe');
    }
    
    // Verificar se home_team_name existe
    if (!sampleMatch || !sampleMatch[0] || !('home_team_name' in sampleMatch[0])) {
      console.log('   📝 Adicionando coluna home_team_name...');
      console.log('📄 Execute este SQL no Supabase Studio:');
      console.log('ALTER TABLE game_competition_matches ADD COLUMN IF NOT EXISTS home_team_name VARCHAR(255);');
    } else {
      console.log('   ✅ Coluna home_team_name já existe');
    }
    
    // Verificar se away_team_name existe
    if (!sampleMatch || !sampleMatch[0] || !('away_team_name' in sampleMatch[0])) {
      console.log('   📝 Adicionando coluna away_team_name...');
      console.log('📄 Execute este SQL no Supabase Studio:');
      console.log('ALTER TABLE game_competition_matches ADD COLUMN IF NOT EXISTS away_team_name VARCHAR(255);');
    } else {
      console.log('   ✅ Coluna away_team_name já existe');
    }
    
    // 4. CRIAR ÍNDICES PARA PERFORMANCE
    console.log('\n📋 4. Criando índices para performance...');
    console.log('📄 Execute este SQL no Supabase Studio:');
    console.log('CREATE INDEX IF NOT EXISTS idx_competition_matches_round ON game_competition_matches(competition_id, round_number);');
    
    // 5. TESTAR ESTRUTURA
    console.log('\n🧪 5. Testando estrutura...');
    await testTableStructure(supabase);
    
    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. Execute os comandos SQL no Supabase Studio');
    console.log('   2. Execute novamente o script de reformulação');
    console.log('   3. Teste a criação de calendário');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

async function testTableStructure(supabase) {
  try {
    // Tentar inserir uma partida de teste
    const { data: testMatch, error: insertError } = await supabase
      .from('game_competition_matches')
      .insert({
        competition_id: '00000000-0000-0000-0000-000000000000', // ID inválido para teste
        home_team_id: '00000000-0000-0000-0000-000000000000',
        away_team_id: '00000000-0000-0000-0000-000000000000',
        home_team_name: 'Time Teste Casa',
        away_team_name: 'Time Teste Visitante',
        match_date: new Date().toISOString(),
        round_number: 1,
        status: 'scheduled'
      })
      .select();
    
    if (insertError) {
      console.log(`   ❌ Erro ao testar inserção: ${insertError.message}`);
    } else {
      console.log('   ✅ Estrutura da tabela está correta');
      
      // Remover partida de teste
      if (testMatch && testMatch.length > 0) {
        await supabase
          .from('game_competition_matches')
          .delete()
          .eq('id', testMatch[0].id);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no teste: ${error.message}`);
  }
}

// Executar correção
fixCompetitionMatchesTable(); 