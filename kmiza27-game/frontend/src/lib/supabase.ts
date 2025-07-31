import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o jogo
export interface GameTeam {
  id: string;
  name: string;
  slug: string;
  short_name?: string;
  owner_id: string;
  team_type: 'user_created' | 'real';
  real_team_id?: number;
  colors: {
    primary: string;
    secondary: string;
  };
  logo_url?: string;
  stadium_name?: string;
  stadium_capacity: number;
  budget: number;
  reputation: number;
  fan_base: number;
  game_stats: any;
  created_at: string;
  updated_at: string;
}

export interface YouthCategory {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  is_active: boolean;
  created_at: string;
}

export interface YouthAcademy {
  id: string;
  team_id: string;
  level: number;
  facilities: {
    training_fields: number;
    gym_quality: number;
    medical_center: number;
    dormitory_capacity: number;
    coaching_staff: number;
  };
  investment: number;
  monthly_cost: number;
  efficiency_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface YouthPlayer {
  id: string;
  name: string;
  position: string;
  date_of_birth: string;
  nationality: string;
  team_id?: string;
  category_id: string;
  attributes: {
    physical: number;
    technical: number;
    mental: number;
  };
  potential: {
    physical: number;
    technical: number;
    mental: number;
  };
  status: 'available' | 'scouted' | 'contracted' | 'promoted';
  scouted_date?: string;
  contract_date?: string;
  created_at: string;
  updated_at: string;
} 