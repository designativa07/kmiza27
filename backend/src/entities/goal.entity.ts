import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Match } from './match.entity';
import { Team } from './team.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match, match => match.goals)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ type: 'varchar', length: 255 })
  player_name: string;

  @Column({ type: 'int', nullable: true })
  minute: number;

  @Column({ type: 'boolean', default: false })
  is_penalty: boolean;

  @Column({ type: 'boolean', default: false })
  is_own_goal: boolean;

  @Column({ type: 'text', nullable: true })
  video_url: string;

  @CreateDateColumn()
  created_at: Date;
} 