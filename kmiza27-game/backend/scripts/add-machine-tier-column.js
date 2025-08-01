const { getSupabaseClient } = require('../config/supabase-connection');

async function addMachineTierColumn() {
  try {
    console.log('🔧 Adicionando coluna machine_tier à tabela game_teams...');
    
    const supabase = getSupabaseClient('vps');
    
    // Script SQL para adicionar a coluna
    const sqlScript = `
      ALTER TABLE game_teams 
      ADD COLUMN IF NOT EXISTS machine_tier INTEGER;
      
      -- Verificar se a coluna foi adicionada
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'game_teams' 
      AND column_name = 'machine_tier';
    `;
    
    console.log('📄 Executando script SQL...');
    console.log('SQL:', sqlScript);
    
    // Como não podemos executar SQL direto via Supabase client,
    // vamos mostrar o script para executar no Supabase Dashboard
    
    console.log('\n📋 Para executar este script:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o script acima');
    console.log('4. Execute o script');
    console.log('5. Depois execute novamente: node scripts/create-machine-teams.js');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar script
addMachineTierColumn(); 