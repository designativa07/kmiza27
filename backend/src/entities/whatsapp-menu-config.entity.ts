import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('whatsapp_menu_configs')
export class WhatsAppMenuConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  section_id: string; // ex: 'acoes_rapidas', 'informacoes_partidas'

  @Column({ type: 'varchar', length: 100 })
  section_title: string; // ex: '⚡ Ações Rápidas'

  @Column({ type: 'int', default: 1 })
  section_order: number; // ordem de exibição das seções

  @Column({ type: 'varchar', length: 50 })
  item_id: string; // ex: 'CMD_JOGOS_HOJE'

  @Column({ type: 'varchar', length: 100 })
  item_title: string; // ex: '📅 Jogos de Hoje'

  @Column({ type: 'varchar', length: 200 })
  item_description: string; // ex: 'Todos os jogos de hoje'

  @Column({ type: 'int', default: 1 })
  item_order: number; // ordem de exibição dos itens dentro da seção

  @Column({ type: 'boolean', default: true })
  active: boolean; // se o item está ativo

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 