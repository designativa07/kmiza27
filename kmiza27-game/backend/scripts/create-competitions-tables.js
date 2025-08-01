const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCompetitionsTables() {
  try {
    console.log('🚀 Criando tabelas do sistema de competições...');

    // 1. Criar tabela game_competitions
    console.log('📋 Criando tabela game_competitions...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS game_competitions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
          type VARCHAR(20) NOT NULL CHECK (type IN ('pvp', 'pve')),
          max_teams INTEGER DEFAULT 20,
          min_teams INTEGER DEFAULT 8,
          season_year INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'finished')),
          promotion_spots INTEGER DEFAULT 4,
          relegation_spots INTEGER DEFAULT 4,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela game_competitions criada!');

    // 2. Criar tabela game_competition_teams
    console.log('📋 Criando tabela game_competition_teams...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS game_competition_teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          competition_id UUID NOT NULL REFERENCES game_competitions(id) ON DELETE CASCADE,
          team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
          points INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          draws INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          goals_for INTEGER DEFAULT 0,
          goals_against INTEGER DEFAULT 0,
          goal_difference INTEGER DEFAULT 0,
          position INTEGER,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'promoted', 'relegated')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(competition_id, team_id)
        );
      `
    });
    console.log('✅ Tabela game_competition_teams criada!');

    // 3. Criar tabela game_direct_matches
    console.log('📋 Criando tabela game_direct_matches...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS game_direct_matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('single', 'home_away')),
          home_team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
          away_team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
          home_score INTEGER DEFAULT 0,
          away_score INTEGER DEFAULT 0,
          away_home_score INTEGER DEFAULT 0,
          away_away_score INTEGER DEFAULT 0,
          aggregate_home_score INTEGER DEFAULT 0,
          aggregate_away_score INTEGER DEFAULT 0,
          winner_team_id UUID REFERENCES game_teams(id),
          match_date TIMESTAMP WITH TIME ZONE NOT NULL,
          return_match_date TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'cancelled')),
          highlights TEXT[],
          simulation_data JSONB,
          created_by UUID NOT NULL,
          accepted_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela game_direct_matches criada!');

    // 4. Criar tabela game_match_invites
    console.log('📋 Criando tabela game_match_invites...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS game_match_invites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          match_id UUID NOT NULL REFERENCES game_direct_matches(id) ON DELETE CASCADE,
          from_user_id UUID NOT NULL,
          to_user_id UUID NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
          message TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    console.log('✅ Tabela game_match_invites criada!');

    // 5. Criar tabela game_team_stats
    console.log('📋 Criando tabela game_team_stats...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS game_team_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
          total_matches INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          draws INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          goals_for INTEGER DEFAULT 0,
          goals_against INTEGER DEFAULT 0,
          clean_sheets INTEGER DEFAULT 0,
          goals_scored_in_row INTEGER DEFAULT 0,
          unbeaten_streak INTEGER DEFAULT 0,
          win_streak INTEGER DEFAULT 0,
          last_match_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(team_id)
        );
      `
    });
    console.log('✅ Tabela game_team_stats criada!');

    // 6. Criar tabela game_head_to_head
    console.log('📋 Criando tabela game_head_to_head...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS game_head_to_head (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team1_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
          team2_id UUID NOT NULL REFERENCES game_teams(id) ON DELETE CASCADE,
          team1_wins INTEGER DEFAULT 0,
          team2_wins INTEGER DEFAULT 0,
          draws INTEGER DEFAULT 0,
          total_matches INTEGER DEFAULT 0,
          last_match_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(team1_id, team2_id)
        );
      `
    });
    console.log('✅ Tabela game_head_to_head criada!');

    console.log('🎉 Todas as tabelas foram criadas com sucesso!');

  } catch (error) {
    console.error('💥 Erro ao criar tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createCompetitionsTables().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { createCompetitionsTables }; 