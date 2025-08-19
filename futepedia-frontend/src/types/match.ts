interface Team {
  id: number;
  name: string;
  logo_url: string;
}

interface Stadium {
  id: number;
  name: string;
  city?: string;
}

export interface Competition {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string;
}

export interface Match {
  id: number;
  status: 'SCHEDULED' | 'TO_CONFIRM' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED' | 'scheduled' | 'to_confirm' | 'in_progress' | 'finished' | 'postponed';
  match_date: string;
  home_team: Team;
  away_team: Team;
  home_score?: number;
  away_score?: number;
  home_score_penalties?: number;
  away_score_penalties?: number;
  stadium?: Stadium;
  is_knockout?: boolean;
  tie_id?: string;
  leg?: 'first_leg' | 'second_leg' | 'single_match';
  competition?: Competition;

  broadcasts?: {
    channel: {
      id: number;
      name: string;
      channel_link: string;
    };
  }[];
  broadcast_channels?: string[] | string;
  group_name?: string;
  round_number?: number;
  phase?: string;
  round?: {
    id: number;
    name: string;
    round_number: number;
  };
}

export interface KnockoutTie {
  id: string; // Um ID único para o confronto (ex: combinação dos IDs das partidas ou slugs dos times)
  phase: string;
  home_team: Team;
  away_team: Team;
  leg1: Match;
  leg2?: Match; // Opcional, caso seja apenas um jogo
  aggregate_home_score?: number;
  aggregate_away_score?: number;
  winner_team?: Team; // Opcional, para indicar o vencedor do confronto
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED'; // Status do confronto
} 