const fetch = require('node-fetch');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

async function createCompetitionsTablesV2() {
  try {
    console.log('🚀 Criando tabelas do sistema de competições (v2)...');

    // 1. Criar tabela game_competitions
    console.log('📋 Criando tabela game_competitions...');
    const createCompetitionsSQL = `
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
    `;

    const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: createCompetitionsSQL })
    });

    if (!response1.ok) {
      console.log(`❌ Erro ao criar game_competitions: ${response1.status} ${response1.statusText}`);
    } else {
      console.log('✅ Tabela game_competitions criada!');
    }

    // 2. Criar tabela game_competition_teams
    console.log('📋 Criando tabela game_competition_teams...');
    const createCompetitionTeamsSQL = `
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
    `;

    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: createCompetitionTeamsSQL })
    });

    if (!response2.ok) {
      console.log(`❌ Erro ao criar game_competition_teams: ${response2.status} ${response2.statusText}`);
    } else {
      console.log('✅ Tabela game_competition_teams criada!');
    }

    // 3. Criar tabela game_direct_matches
    console.log('📋 Criando tabela game_direct_matches...');
    const createDirectMatchesSQL = `
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
    `;

    const response3 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: createDirectMatchesSQL })
    });

    if (!response3.ok) {
      console.log(`❌ Erro ao criar game_direct_matches: ${response3.status} ${response3.statusText}`);
    } else {
      console.log('✅ Tabela game_direct_matches criada!');
    }

    console.log('🎉 Tentativa de criação concluída!');

  } catch (error) {
    console.error('💥 Erro ao criar tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createCompetitionsTablesV2().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { createCompetitionsTablesV2 }; 