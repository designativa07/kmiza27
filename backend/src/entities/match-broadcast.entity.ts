import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Match } from './match.entity';
import { Channel } from './channel.entity';

@Entity('match_broadcasts')
export class MatchBroadcast {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id' })
  match_id: number;

  @ManyToOne(() => Channel, channel => channel.broadcasts)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ name: 'channel_id' })
  channel_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 