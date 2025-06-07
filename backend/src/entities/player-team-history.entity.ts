import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { Team } from './team.entity';

@Entity('player_team_history')
export class PlayerTeamHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ length: 50, nullable: true })
  jersey_number: string; // Número da camisa

  @Column({ length: 50, nullable: true })
  role: string; // Ex: Jogador, Emprestado, etc.

  @ManyToOne(() => Player, player => player.team_history)
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column()
  player_id: number;

  @ManyToOne(() => Team, team => team.player_history)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column()
  team_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
} 