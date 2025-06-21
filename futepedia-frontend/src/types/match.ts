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

export interface Match {
  id: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED' | 'scheduled' | 'in_progress' | 'finished' | 'postponed';
  match_date: string;
  home_team: Team;
  away_team: Team;
  home_score?: number;
  away_score?: number;
  home_score_penalties?: number;
  away_score_penalties?: number;
  stadium?: Stadium;

  broadcast_channels?: string[] | string;
  group_name?: string;
  round_number?: number;
  phase?: string;
} 