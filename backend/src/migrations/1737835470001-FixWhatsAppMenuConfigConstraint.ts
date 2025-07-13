import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixWhatsAppMenuConfigConstraint1737835470001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a constraint única existe e removê-la
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'UQ_0e300524f8db1cfe5a38dd6e41a' 
        AND table_name = 'whatsapp_menu_configs'
      )
    `);

    if (constraintExists[0].exists) {
      console.log('🔧 Removendo constraint única incorreta...');
      await queryRunner.query('ALTER TABLE whatsapp_menu_configs DROP CONSTRAINT "UQ_0e300524f8db1cfe5a38dd6e41a"');
      console.log('✅ Constraint única removida com sucesso');
    }

    // Verificar se há dados na tabela
    const dataCount = await queryRunner.query('SELECT COUNT(*) as total_registros FROM whatsapp_menu_configs');
    const totalRegistros = parseInt(dataCount[0].total_registros);

    // Inserir dados padrão se não existirem
    if (totalRegistros === 0) {
      console.log('📝 Inserindo dados padrão do menu...');
      
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
        ('competicoes_outros', '🏆 Competições e Outros', 4, 'CMD_INFO_COMPETICOES', '🏆 Informações de Competições', 'Dados gerais de uma competição', 3)
      `);
      
      console.log('✅ Dados padrão inseridos com sucesso');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover dados inseridos
    await queryRunner.query('DELETE FROM whatsapp_menu_configs');
    
    // Recriar constraint única (se necessário para rollback)
    await queryRunner.query('ALTER TABLE whatsapp_menu_configs ADD CONSTRAINT "UQ_0e300524f8db1cfe5a38dd6e41a" UNIQUE (section_id)');
  }
} 