const { getSupabaseClient } = require('../config/supabase-connection');
const fs = require('fs');
const path = require('path');

async function fixMatchesTable() {
  try {
    console.log('🔧 Corrigindo estrutura da tabela game_matches...');
    
    const supabase = getSupabaseClient('vps');
    
    // Ler o script SQL
    const sqlPath = path.join(__dirname, '../../fix-game-matches-complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executando script SQL...');
    
    // Executar o script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar script SQL:', error);
      
      // Tentar executar comandos individuais
      console.log('🔄 Tentando executar comandos individuais...');
      
      const commands = [
        "ALTER TABLE game_matches ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE game_matches ADD COLUMN IF NOT EXISTS home_team_name VARCHAR(255)",
        "ALTER TABLE game_matches ADD COLUMN IF NOT EXISTS away_team_name VARCHAR(255)",
        "ALTER TABLE game_matches ADD COLUMN IF NOT EXISTS match_date TIMESTAMP WITH TIME ZONE",
        "CREATE INDEX IF NOT EXISTS idx_game_matches_home_team_id ON game_matches(home_team_id)",
        "CREATE INDEX IF NOT EXISTS idx_game_matches_away_team_id ON game_matches(away_team_id)",
        "CREATE INDEX IF NOT EXISTS idx_game_matches_match_date ON game_matches(match_date)",
        "CREATE INDEX IF NOT EXISTS idx_game_matches_status ON game_matches(status)"
      ];
      
      for (const command of commands) {
        try {
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
          if (cmdError) {
            console.log(`⚠️ Comando falhou: ${command}`);
            console.log(`Erro: ${cmdError.message}`);
          } else {
            console.log(`✅ Comando executado: ${command}`);
          }
        } catch (cmdError) {
          console.log(`⚠️ Comando falhou: ${command}`);
          console.log(`Erro: ${cmdError.message}`);
        }
      }
    } else {
      console.log('✅ Script SQL executado com sucesso!');
    }
    
    // Verificar se a correção funcionou
    console.log('\n🔍 Verificando se a correção funcionou...');
    
    const { data: testMatch, error: testError } = await supabase
      .from('game_matches')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError);
      return;
    }
    
    if (testMatch && testMatch.length > 0) {
      const match = testMatch[0];
      const hasFinishedAt = 'finished_at' in match;
      
      if (hasFinishedAt) {
        console.log('✅ Coluna finished_at foi adicionada com sucesso!');
      } else {
        console.log('❌ Coluna finished_at ainda não existe');
      }
      
      console.log('\n📋 Colunas disponíveis:');
      Object.keys(match).forEach(col => {
        console.log(`  - ${col}: ${typeof match[col]}`);
      });
    } else {
      console.log('📝 Tabela está vazia - criando dados de teste...');
      
      // Criar dados de teste
      const { data: insertData, error: insertError } = await supabase
        .from('game_matches')
        .insert({
          home_team_id: '00000000-0000-0000-0000-000000000001',
          away_team_id: '00000000-0000-0000-0000-000000000002',
          home_team_name: 'Time Teste Casa',
          away_team_name: 'Time Teste Visitante',
          match_date: new Date().toISOString(),
          status: 'scheduled',
          home_score: 0,
          away_score: 0
        })
        .select();
      
      if (insertError) {
        console.error('❌ Erro ao inserir dados de teste:', insertError);
      } else {
        console.log('✅ Dados de teste criados com sucesso!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixMatchesTable(); 