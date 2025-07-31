import { createClient } from '@supabase/supabase-js';

export class SupabaseConfig {
  private static instance: SupabaseConfig;
  private supabaseClient;

  private constructor() {
    // Configuração do Supabase local
    const supabaseUrl = process.env.SUPABASE_URL || 'https://kmiza27-supabase.h4xd66.easypanel.host/';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  public static getInstance(): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig();
    }
    return SupabaseConfig.instance;
  }

  public getClient() {
    return this.supabaseClient;
  }
}

export const supabase = SupabaseConfig.getInstance().getClient(); 