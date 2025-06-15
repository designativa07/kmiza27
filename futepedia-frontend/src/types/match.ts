interface Team {
  id: number;
  name: string;
  logo_url: string;
}

interface Stadium {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED';
  match_date: string;
  home_team: Team;
  away_team: Team;
  home_score?: number;
  away_score?: number;
  stadium?: Stadium;
} 