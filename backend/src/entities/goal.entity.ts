import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Match } from './match.entity';
import { Player } from './player.entity';
import { Team } from './team.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  match_id: number;

  @ManyToOne(() => Match, match => match.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column()
  player_id: number;

  @ManyToOne(() => Player, player => player.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ length: 255 })
  player_name: string; // Nome do jogador que marcou o gol

  @Column({ nullable: true })
  team_id: number; // Time que marcou o gol

  @ManyToOne(() => Team, team => team.id, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ type: 'int', nullable: true })
  minute: number; // Minuto em que o gol foi marcado

  @Column({ length: 255, nullable: true })
  type: string; // Ex: 'normal', 'penalty', 'own_goal'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
} 