import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class NewsService {
  async feed(teamId: string) {
    const { data, error } = await supabase
      .from('game_news')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(2);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async publish(teamId: string, type: string, title: string, message?: string) {
    const { data, error } = await supabase
      .from('game_news')
      .insert({ team_id: teamId, type, title, message })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { success: true, item: data };
  }
}



