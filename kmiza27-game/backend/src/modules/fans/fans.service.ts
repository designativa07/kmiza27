import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class FansService {
  async getSummary(teamId: string) {
    const { data } = await supabase.from('game_fanbase').select('*').eq('team_id', teamId).single();
    if (data) return data;
    return { team_id: teamId, fans_count: 8000, mood: 60, trend: 0 };
  }

  async applyMatch(payload: any) {
    const { teamId, result } = payload;
    const current = await this.getSummary(teamId);
    let deltaMood = result === 'win' ? 3 : result === 'draw' ? 1 : -3;
    const mood = Math.max(0, Math.min(100, (current.mood || 50) + deltaMood));
    const fans_count = Math.max(1000, Math.round((current.fans_count || 8000) * (1 + (deltaMood/200))));
    await supabase.from('game_fanbase').upsert({ team_id: teamId, mood, fans_count, trend: deltaMood }).select();
    return { success: true, deltaMood, deltaFans: fans_count - (current.fans_count || 8000), mood, fans_count };
  }
}


