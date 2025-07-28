import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('stadiums')
export class Stadium {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, default: 'Brasil' })
  country: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'int', nullable: true })
  opened_year: number;

  @Column({ type: 'text', nullable: true })
  history: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'varchar', length: 50, default: 'professional' })
  category: string; // 'professional' ou 'amateur'
} 