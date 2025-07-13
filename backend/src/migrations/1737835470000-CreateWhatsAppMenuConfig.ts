import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWhatsAppMenuConfig1737835470000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_menu_configs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'section_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'section_title',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'section_order',
            type: 'int',
            default: 1,
          },
          {
            name: 'item_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'item_title',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'item_description',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'item_order',
            type: 'int',
            default: 1,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar índices para performance
    await queryRunner.createIndex(
      'whatsapp_menu_configs',
      new TableIndex({ name: 'idx_section_order', columnNames: ['section_order'] }),
    );

    await queryRunner.createIndex(
      'whatsapp_menu_configs',
      new TableIndex({ name: 'idx_item_order', columnNames: ['item_order'] }),
    );

    await queryRunner.createIndex(
      'whatsapp_menu_configs',
      new TableIndex({ name: 'idx_active', columnNames: ['active'] }),
    );

    // Inserir dados padrão do menu atual
    await queryRunner.query(`
      INSERT INTO whatsapp_menu_configs (section_id, section_title, section_order, item_id, item_title, item_description, item_order) VALUES
      -- Seção 1: Ações Rápidas
      ('acoes_rapidas', '⚡ Ações Rápidas', 1, 'MENU_TABELAS_CLASSIFICACAO', '📊 Tabelas de Classificação', 'Ver classificação das competições', 1),
      ('acoes_rapidas', '⚡ Ações Rápidas', 1, 'CMD_JOGOS_HOJE', '📅 Jogos de Hoje', 'Todos os jogos de hoje', 2),
      ('acoes_rapidas', '⚡ Ações Rápidas', 1, 'CMD_JOGOS_AMANHA', '📆 Jogos de Amanhã', 'Todos os jogos de amanhã', 3),
      ('acoes_rapidas', '⚡ Ações Rápidas', 1, 'CMD_JOGOS_SEMANA', '🗓️ Jogos da Semana', 'Jogos desta semana', 4),
      
      -- Seção 2: Informações de Partidas
      ('informacoes_partidas', '⚽ Informações de Partidas', 2, 'CMD_PROXIMOS_JOGOS', '⚽ Próximos Jogos', 'Próximo jogo de um time', 1),
      ('informacoes_partidas', '⚽ Informações de Partidas', 2, 'CMD_ULTIMO_JOGO', '🏁 Últimos Jogos', 'Últimos 3 jogos de um time', 2),
      ('informacoes_partidas', '⚽ Informações de Partidas', 2, 'CMD_TRANSMISSAO', '📺 Transmissão', 'Onde passa o jogo de um time', 3),
      
      -- Seção 3: Times, Jogadores e Estádios
      ('times_jogadores_estadios', '👥 Times, Jogadores e Estádios', 3, 'CMD_INFO_TIME', 'ℹ️ Informações do Time', 'Dados gerais de um time', 1),
      ('times_jogadores_estadios', '👥 Times, Jogadores e Estádios', 3, 'CMD_ELENCO_TIME', '👥 Elenco do Time', 'Ver elenco de um time', 2),
      ('times_jogadores_estadios', '👥 Times, Jogadores e Estádios', 3, 'CMD_INFO_JOGADOR', '👤 Informações do Jogador', 'Dados de um jogador', 3),
      ('times_jogadores_estadios', '👥 Times, Jogadores e Estádios', 3, 'CMD_POSICAO_TIME', '📍 Posição na Tabela', 'Posição do time na competição', 4),
      ('times_jogadores_estadios', '👥 Times, Jogadores e Estádios', 3, 'CMD_ESTATISTICAS_TIME', '📈 Estatísticas do Time', 'Estatísticas detalhadas de um time', 5),
      ('times_jogadores_estadios', '👥 Times, Jogadores e Estádios', 3, 'CMD_ESTADIOS', '🏟️ Estádios', 'Informações sobre estádios', 6),
      
      -- Seção 4: Competições e Outros
      ('competicoes_outros', '🏆 Competições e Outros', 4, 'CMD_ARTILHEIROS', '🥇 Artilheiros', 'Maiores goleadores de uma competição', 1),
      ('competicoes_outros', '🏆 Competições e Outros', 4, 'CMD_CANAIS', '📡 Canais', 'Canais de transmissão', 2),
      ('competicoes_outros', '🏆 Competições e Outros', 4, 'CMD_INFO_COMPETICOES', '🏆 Informações de Competições', 'Dados gerais de uma competição', 3);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('whatsapp_menu_configs');
  }
} 