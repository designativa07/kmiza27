import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Competition } from './competition.entity';
import { Team } from './team.entity';

@Entity('competition_teams')
@Unique(['competition', 'team'])
export class CompetitionTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Competition, competition => competition.competitionTeams)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @ManyToOne(() => Team, team => team.competitionTeams)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group_name: string;

  @Column({ type: 'int', nullable: true })
  position: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 0 })
  played: number;

  @Column({ type: 'int', default: 0 })
  won: number;

  @Column({ type: 'int', default: 0 })
  drawn: number;

  @Column({ type: 'int', default: 0 })
  lost: number;

  @Column({ type: 'int', default: 0 })
  goals_for: number;

  @Column({ type: 'int', default: 0 })
  goals_against: number;

  @Column({ type: 'int', generatedType: 'STORED', asExpression: 'goals_for - goals_against' })
  goal_difference: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  form: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 