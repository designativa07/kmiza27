import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Competition } from './competition.entity';

export interface PowerIndexEntry {
  team_id: number;
  team_name: string;
  power_index: number;
  points_per_game: number;
  goal_difference_per_game: number;
  recent_form_score: number;
  games_played: number;
  points: number;
  goal_difference: number;
}

export interface TeamPrediction {
  team_id: number;
  team_name: string;
  current_position: number;
  title_probability: number;        // Probabilidade de título (0-100)
  relegation_probability: number;   // Probabilidade de rebaixamento (0-100)
  top4_probability: number;         // Probabilidade de G4/Libertadores (0-100)
  top6_probability: number;         // Probabilidade de G6/Sul-Americana (0-100)
  average_final_position: number;   // Posição média final
  average_final_points: number;     // Pontuação média final
  position_distribution: {          // Distribuição de posições
    [position: number]: number;     // posição: % de chance
  };
}

export interface SimulationMetadata {
  execution_duration_ms: number;
  simulation_count: number;
  executed_by: string;
  algorithm_version: string;
  power_index_weights: {
    points_per_game: number;
    goal_difference_per_game: number;
    recent_form: number;
  };
}

@Entity('simulation_results')
@Index(['competition', 'execution_date'])
@Index(['competition', 'is_latest'])
export class SimulationResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Competition, { eager: true })
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @CreateDateColumn()
  execution_date: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('int')
  simulation_count: number;

  @Column('varchar', { length: 100 })
  executed_by: string;

  @Column('boolean', { default: false })
  is_latest: boolean; // Flag para marcar a simulação mais recente de cada competição

  @Column('jsonb')
  power_index_data: PowerIndexEntry[];

  @Column('jsonb')
  simulation_results: TeamPrediction[];

  @Column('jsonb')
  metadata: SimulationMetadata;

  @Column('int')
  execution_duration_ms: number;

  @Column('varchar', { length: 50, default: '1.0.0' })
  algorithm_version: string;

  // Método para buscar probabilidades de um time específico
  getTeamPrediction(teamId: number): TeamPrediction | null {
    return this.simulation_results.find(result => result.team_id === teamId) || null;
  }

  // Método para buscar Power Index de um time específico
  getTeamPowerIndex(teamId: number): PowerIndexEntry | null {
    return this.power_index_data.find(entry => entry.team_id === teamId) || null;
  }

  // Método para obter top N times com maior probabilidade de título
  getTopTitleContenders(limit: number = 5): TeamPrediction[] {
    return this.simulation_results
      .sort((a, b) => b.title_probability - a.title_probability)
      .slice(0, limit);
  }

  // Método para obter times em risco de rebaixamento
  getRelegationRisk(threshold: number = 10): TeamPrediction[] {
    return this.simulation_results
      .filter(result => result.relegation_probability >= threshold)
      .sort((a, b) => b.relegation_probability - a.relegation_probability);
  }
}
