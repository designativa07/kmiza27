import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class InvestmentsService {
  async getCatalog(teamId: string) {
    return {
      teamId,
      items: [
        { id: 'stadium_expansion', name: 'Expansão do Estádio', cost: 500000, effect: '+3000 lugares' },
        { id: 'youth_academy', name: 'Academia de Base', cost: 200000, effect: '+10% eficiência' },
        { id: 'medical_center', name: 'Centro Médico', cost: 300000, effect: '-20% lesões' },
        { id: 'training_center', name: 'Centro de Treinamento', cost: 400000, effect: '+10% treino' },
      ],
    };
  }

  async invest(teamId: string, itemId: string) {
    // Registrar histórico
    await supabase.from('game_investments').insert({ team_id: teamId, item_id: itemId, cost: this.costFor(itemId) });

    // Aplicar efeitos simples
    if (itemId === 'stadium_expansion') {
      await supabase.rpc('exec_sql', { sql: `UPDATE game_teams SET stadium_capacity = COALESCE(stadium_capacity,0) + 3000 WHERE id = '${teamId}'` });
    }

    if (itemId === 'training_center') {
      // Podemos refletir em táticas/academia no futuro; por ora, apenas registra
    }

    if (itemId === 'youth_academy') {
      // Poderia criar uma tabela de níveis; por simplicidade, deixar no histórico por enquanto
    }

    return { success: true };
  }

  private costFor(itemId: string) {
    switch (itemId) {
      case 'stadium_expansion': return 500000;
      case 'youth_academy': return 200000;
      case 'medical_center': return 300000;
      case 'training_center': return 400000;
      default: return 0;
    }
  }
}


