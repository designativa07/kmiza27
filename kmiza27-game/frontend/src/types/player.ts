export const ATTRIBUTE_LABELS = {
  PAC: 'Ritmo',        // Pace (Speed + Acceleration)
  FIN: 'Finalização',  // Finishing (Shooting + Finishing)
  PAS: 'Passe',        // Passing
  DRI: 'Drible',       // Dribbling
  DEF: 'Defesa',       // Defending
  FIS: 'Físico',       // Physical (Strength + Stamina)
  GOL: 'Goleiro'       // Goalkeeping
} as const;

export interface PlayerCardData {
  id: string;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential?: number;
  
  // Atributos para o card
  attributes: {
    PAC: number;  // Ritmo (speed + acceleration)
    FIN: number;  // Finalização (shooting + finishing)
    PAS: number;  // Passe
    DRI: number;  // Drible
    DEF: number;  // Defesa
    FIS: number;  // Físico (strength + stamina)
    GOL?: number; // Goleiro (apenas para GK)
  };
  
  // Estado do jogador
  morale?: number;
  fitness?: number;
  form?: number;
  fatigue?: number;
  injury_severity?: number;
  
  // Informações de contrato
  salary?: number;
  market_value?: number;
  
  // Informações de treino
  training_focus?: keyof typeof ATTRIBUTE_LABELS;
  training_intensity?: 'baixa' | 'normal' | 'alta';
  is_in_academy?: boolean;
  
  // Personalidade
  personality?: string;
  
  // Estatísticas
  games_played?: number;
  goals_scored?: number;
  assists?: number;
  average_rating?: number;
}
