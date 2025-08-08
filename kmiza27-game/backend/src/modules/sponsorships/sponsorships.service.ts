import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class SponsorshipsService {
  async list(teamId: string) {
    const { data: contracts } = await supabase
      .from('game_sponsorships')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active');

    const offers = [
      { id: 'offer-shirt', slot: 'shirt', name: 'TechCorp', amountPerMonth: 50000, durationMonths: 12 },
      { id: 'offer-stadium', slot: 'stadium', name: 'EnergyDrink', amountPerMonth: 30000, durationMonths: 6 },
      { id: 'offer-sleeve', slot: 'sleeve', name: 'BetPlus', amountPerMonth: 20000, durationMonths: 12 },
    ];

    return { contracts: contracts || [], offers };
  }

  async negotiate(teamId: string, slot: string, months: number) {
    // Escolher primeira oferta do slot
    const list = await this.list(teamId);
    const pick = (list.offers || []).find((o: any) => o.slot === slot) || { name: 'Sponsor', amountPerMonth: 10000 };

    const payload = {
      team_id: teamId,
      slot,
      name: pick.name,
      amount_per_month: pick.amountPerMonth,
      duration_months: months,
      status: 'active',
      started_at: new Date().toISOString().slice(0, 10),
      ends_at: null,
    };

    const { data, error } = await supabase.from('game_sponsorships').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { success: true, contract: data };
  }
}



