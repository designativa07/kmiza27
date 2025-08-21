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
  round_number?: number; // Rodada em que a simulação foi executada
  notes?: string; // Notas sobre a simulação
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

  @Column({ name: 'competition_id' })
  competitionId: number;

  @CreateDateColumn({ name: 'execution_date' })
  executionDate: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'simulation_count' })
  simulationCount: number;

  @Column({ name: 'executed_by', length: 100 })
  executedBy: string;

  @Column({ name: 'is_latest', default: false })
  isLatest: boolean; // Flag para marcar a simulação mais recente de cada competição

  @Column({ name: 'is_important', default: false })
  isImportant: boolean; // Nova: marca simulações importantes para não serem removidas

  @Column({ name: 'retention_days', nullable: true })
  retentionDays: number; // Nova: dias para manter esta simulação (null = usar padrão)

  @Column({ name: 'round_number', nullable: true })
  roundNumber: number; // Nova: rodada em que a simulação foi executada

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string; // Nova: notas sobre a simulação

  @Column('jsonb')
  powerIndexData: PowerIndexEntry[];

  @Column('jsonb')
  simulationResults: TeamPrediction[];

  @Column('jsonb')
  metadata: SimulationMetadata;

  @Column({ name: 'execution_duration_ms' })
  executionDurationMs: number;

  @Column({ name: 'algorithm_version', length: 50, default: '1.0.0' })
  algorithmVersion: string;

  // Método para buscar probabilidades de um time específico
  getTeamPrediction(teamId: number): TeamPrediction | null {
    return this.simulationResults.find(result => result.team_id === teamId) || null;
  }

  // Método para buscar Power Index de um time específico
  getTeamPowerIndex(teamId: number): PowerIndexEntry | null {
    return this.powerIndexData.find(entry => entry.team_id === teamId) || null;
  }

  // Método para obter top N times com maior probabilidade de título
  getTopTitleContenders(limit: number = 5): TeamPrediction[] {
    return this.simulationResults
      .sort((a, b) => b.title_probability - a.title_probability)
      .slice(0, limit);
  }

  // Método para obter times em risco de rebaixamento
  getRelegationRisk(threshold: number = 10): TeamPrediction[] {
    return this.simulationResults
      .filter(result => result.relegation_probability >= threshold)
      .sort((a, b) => b.relegation_probability - a.relegation_probability);
  }
}
