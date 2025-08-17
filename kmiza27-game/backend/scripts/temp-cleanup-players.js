const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (use as mesmas do seu ambiente)
const supabaseUrl = process.env.SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const TEAM_ID_TO_CLEAN = '01bac20e-e4cb-400a-85e9-46ffa3f2f4e7'; // O ID do seu time "FLORIPAAA"

async function cleanPlayers() {
  console.log(`🧹 Iniciando limpeza de jogadores para o time: ${TEAM_ID_TO_CLEAN}`);

  try {
    const { data, error } = await supabaseAdmin
      .from('game_players')
      .delete()
      .eq('team_id', TEAM_ID_TO_CLEAN);

    if (error) {
      throw error;
    }

    console.log(`✅ Sucesso! Jogadores do time foram removidos.`);
    if (data) {
        // Supabase v2 delete doesn't return count, so we just log success
        console.log('Verifique o banco de dados para confirmar a remoção.');
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  }
}

cleanPlayers();
