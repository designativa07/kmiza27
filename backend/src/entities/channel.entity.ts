import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MatchBroadcast } from './match-broadcast.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channel_number: string;

  @Column({ type: 'text', nullable: true })
  channel_link: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'streaming', 'cable', 'tv', 'other'

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => MatchBroadcast, broadcast => broadcast.channel)
  broadcasts: MatchBroadcast[];
} 