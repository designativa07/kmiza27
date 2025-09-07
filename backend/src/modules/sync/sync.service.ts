import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as pg from 'pg';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Verifica se estamos em ambiente de desenvolvimento
   */
  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Obtém configuração de conexão com produção
   */
  private getProductionConfig(): pg.ClientConfig {
    return {
      host: process.env.PROD_DB_HOST || 'h4xd66.easypanel.host',
      port: parseInt(process.env.PROD_DB_PORT || '5433', 10),
      database: process.env.PROD_DB_DATABASE || 'kmiza27',
      user: process.env.PROD_DB_USERNAME || 'postgres',
      password: process.env.PROD_DB_PASSWORD,
      ssl: false,
    };
  }

  /**
   * Obtém configuração de conexão com desenvolvimento
   */
  private getDevelopmentConfig(): pg.ClientConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_DATABASE || 'kmiza27_dev',
      user: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'password',
      ssl: false,
    };
  }

  /**
   * Executa uma query em um banco específico
   */
  private async executeQuery(config: pg.ClientConfig, query: string, params?: any[]): Promise<any[]> {
    const client = new pg.Client(config);
    
    try {
      await client.connect();
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  /**
   * Obtém lista de tabelas do banco de dados
   */
  private async getTables(config: pg.ClientConfig): Promise<string[]> {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await this.executeQuery(config, query);
    return result.map(row => row.table_name);
  }

  /**
   * Obtém estrutura de uma tabela
   */
  private async getTableStructure(config: pg.ClientConfig, tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    return await this.executeQuery(config, query, [tableName]);
  }

  /**
   * Limpa dados de uma tabela (TRUNCATE CASCADE)
   */
  private async truncateTable(config: pg.ClientConfig, tableName: string): Promise<void> {
    const query = `TRUNCATE TABLE "${tableName}" CASCADE;`;
    await this.executeQuery(config, query);
  }

  /**
   * Obtém as colunas de uma tabela no banco de destino
   */
  private async getTargetTableColumns(config: pg.ClientConfig, tableName: string): Promise<string[]> {
    const client = new pg.Client(config);
    try {
      await client.connect();
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      return result.rows.map(row => row.column_name);
    } finally {
      await client.end();
    }
  }

  /**
   * Sanitiza dados de linha para logs (remove dados sensíveis)
   */
  private sanitizeRowData(row: any, columns: string[]): any {
    const sanitized: any = {};
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    
    for (const col of columns) {
      const isSensitive = sensitiveFields.some(field => 
        col.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized[col] = '[REDACTED]';
      } else {
        sanitized[col] = row[col];
      }
    }
    
    return sanitized;
  }

  /**
   * Processa dados específicos de uma tabela para resolver problemas conhecidos
   */
  private processTableData(tableName: string, row: any): any {
    const processedRow = { ...row };
    
    // Tratamento específico para tabela teams (problema com JSON)
    if (tableName === 'teams') {
      // Converter campos JSON problemáticos para string válida
      if (processedRow.colors && typeof processedRow.colors === 'object') {
        try {
          processedRow.colors = JSON.stringify(processedRow.colors);
        } catch (error) {
          this.logger.warn(`Erro ao processar campo colors na tabela ${tableName}:`, error);
          processedRow.colors = '{}';
        }
      }
      
      if (processedRow.social_media && typeof processedRow.social_media === 'object') {
        try {
          processedRow.social_media = JSON.stringify(processedRow.social_media);
        } catch (error) {
          this.logger.warn(`Erro ao processar campo social_media na tabela ${tableName}:`, error);
          processedRow.social_media = '{}';
        }
      }
    }
    
    // Tratamento para tabela simulation_results (colunas problemáticas)
    if (tableName === 'simulation_results') {
      if (processedRow.retention_days === undefined) {
        processedRow.retention_days = null;
      }
      if (processedRow.notes === undefined) {
        processedRow.notes = null;
      }
      if (processedRow.round_number === undefined) {
        processedRow.round_number = null;
      }
      
      // Tratamento especial para campos JSON
      if (processedRow.power_index_data && typeof processedRow.power_index_data === 'object') {
        try {
          processedRow.power_index_data = JSON.stringify(processedRow.power_index_data);
        } catch (error) {
          this.logger.warn(`Erro ao processar power_index_data:`, error);
          processedRow.power_index_data = '[]';
        }
      }
      
      if (processedRow.simulation_results && typeof processedRow.simulation_results === 'object') {
        try {
          processedRow.simulation_results = JSON.stringify(processedRow.simulation_results);
        } catch (error) {
          this.logger.warn(`Erro ao processar simulation_results:`, error);
          processedRow.simulation_results = '[]';
        }
      }
      
      if (processedRow.metadata && typeof processedRow.metadata === 'object') {
        try {
          processedRow.metadata = JSON.stringify(processedRow.metadata);
        } catch (error) {
          this.logger.warn(`Erro ao processar metadata:`, error);
          processedRow.metadata = '{}';
        }
      }
    }
    
    // Tratamento para tabela competition_teams (coluna gerada)
    if (tableName === 'competition_teams') {
      // Remover coluna goal_difference pois é gerada automaticamente
      delete processedRow.goal_difference;
    }
    
    // Tratamento para tabela pools (ignorar se created_by_user_id não existir)
    if (tableName === 'pools') {
      // Se created_by_user_id não existir, usar um usuário padrão ou pular o registro
      if (processedRow.created_by_user_id && processedRow.created_by_user_id !== 1) {
        // Usar usuário admin (ID 1) como padrão
        processedRow.created_by_user_id = 1;
      }
    }
    
    // Tratamento para tabela users (ignorar se favorite_team_id não existir)
    if (tableName === 'users' && processedRow.favorite_team_id) {
      // Verificar se o team existe antes de inserir
      // Se não existir, definir como null
      processedRow.favorite_team_id = null;
    }
    
    // Tratamento para tabela matches (campos JSON problemáticos)
    if (tableName === 'matches') {
      // Tratar campos JSON que podem estar malformados
      const jsonFields = ['broadcast_channels', 'highlights_url', 'match_stats', 'home_team_player_stats', 'away_team_player_stats'];
      
      for (const field of jsonFields) {
        if (processedRow[field] !== null && processedRow[field] !== undefined) {
          if (typeof processedRow[field] === 'string') {
            // Se já é string, verificar se é JSON válido
            try {
              JSON.parse(processedRow[field]);
            } catch (error) {
              // Se não é JSON válido, converter para array vazio
              processedRow[field] = '[]';
            }
          } else if (Array.isArray(processedRow[field])) {
            // Se é array, converter para JSON string
            try {
              processedRow[field] = JSON.stringify(processedRow[field]);
            } catch (error) {
              processedRow[field] = '[]';
            }
          } else if (typeof processedRow[field] === 'object') {
            // Se é objeto, converter para JSON string
            try {
              processedRow[field] = JSON.stringify(processedRow[field]);
            } catch (error) {
              processedRow[field] = '{}';
            }
          }
        }
      }
    }
    
    // Tratamento geral para campos JSON e NULL problemáticos
    for (const [key, value] of Object.entries(processedRow)) {
      if (value === undefined) {
        processedRow[key] = null;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Converter objetos para JSON string
        try {
          processedRow[key] = JSON.stringify(value);
        } catch (error) {
          this.logger.warn(`Erro ao converter campo ${key} para JSON:`, error);
          processedRow[key] = '{}';
        }
      } else if (Array.isArray(value)) {
        // Converter arrays para JSON string
        try {
          processedRow[key] = JSON.stringify(value);
        } catch (error) {
          this.logger.warn(`Erro ao converter array ${key} para JSON:`, error);
          processedRow[key] = '[]';
        }
      }
    }
    
    return processedRow;
  }

  /**
   * Copia dados de uma tabela entre bancos usando INSERT melhorado
   */
  private async copyTableData(
    sourceConfig: pg.ClientConfig,
    targetConfig: pg.ClientConfig,
    tableName: string
  ): Promise<{ rowsCopied: number }> {
    const sourceClient = new pg.Client(sourceConfig);
    const targetClient = new pg.Client(targetConfig);
    
    try {
      await sourceClient.connect();
      await targetClient.connect();
      
      // 1. Verificar se há dados na origem
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await sourceClient.query(countQuery);
      const totalRows = parseInt(countResult.rows[0].count);
      
      if (totalRows === 0) {
        this.logger.log(`Tabela ${tableName} está vazia na origem`);
        return { rowsCopied: 0 };
      }
      
      this.logger.log(`Tabela ${tableName}: ${totalRows} linhas na origem`);
      
      // 2. Buscar dados da origem
      const selectQuery = `SELECT * FROM "${tableName}";`;
      const sourceResult = await sourceClient.query(selectQuery);
      
      if (sourceResult.rows.length === 0) {
        return { rowsCopied: 0 };
      }
      
      // 3. Obter colunas da tabela de destino
      const targetColumns = await this.getTargetTableColumns(targetConfig, tableName);
      
      if (targetColumns.length === 0) {
        this.logger.warn(`Tabela ${tableName}: Nenhuma coluna encontrada no destino`);
        return { rowsCopied: 0 };
      }

      // 4. Filtrar colunas problemáticas
      let validColumns = targetColumns;
      
      // Remover colunas geradas
      if (tableName === 'competition_teams') {
        validColumns = validColumns.filter(col => col !== 'goal_difference');
      }

      if (validColumns.length === 0) {
        this.logger.warn(`Tabela ${tableName}: Nenhuma coluna válida encontrada no destino`);
        return { rowsCopied: 0 };
      }

      // 5. Preparar query de inserção
      const placeholders = validColumns.map((_, index) => `$${index + 1}`).join(', ');
      const insertQuery = `INSERT INTO "${tableName}" (${validColumns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders});`;
        
      let rowsCopied = 0;
      let errors = 0;
      
      // 6. Processar em lotes
      const batchSize = 100;
      for (let i = 0; i < sourceResult.rows.length; i += batchSize) {
        const batch = sourceResult.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            // Preparar valores apenas com colunas válidas
            const values = validColumns.map(col => {
              const value = row[col];
              
              // Tratamento especial para campos JSON
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                try {
                  return JSON.stringify(value);
                } catch (error) {
                  this.logger.warn(`Erro ao converter JSON em ${col}: ${error.message}`);
                  return '{}';
                }
              } else if (Array.isArray(value)) {
                try {
                  return JSON.stringify(value);
                } catch (error) {
                  this.logger.warn(`Erro ao converter array em ${col}: ${error.message}`);
                  return '[]';
                }
              }
              
              return value;
            });
            
            await targetClient.query(insertQuery, values);
            rowsCopied++;
            
          } catch (error) {
            errors++;
            
            // Log detalhado apenas para os primeiros 3 erros
            if (errors <= 3) {
              this.logger.error(`Erro ao inserir linha na tabela ${tableName}:`, {
                error: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                rowData: this.sanitizeRowData(row, validColumns)
              });
            } else if (errors === 4) {
              this.logger.warn(`Muitos erros na tabela ${tableName}, parando logs detalhados...`);
            }
            
            // Se muitos erros, parar para evitar loop infinito
            if (errors > 50) {
              this.logger.error(`Muitos erros na tabela ${tableName} (${errors}), parando sincronização desta tabela`);
              break;
            }
          }
        }
        
        // Log de progresso para tabelas grandes
        if (sourceResult.rows.length > 100) {
          const progress = Math.round((i / sourceResult.rows.length) * 100);
          this.logger.log(`Tabela ${tableName}: ${progress}% processado (${rowsCopied} linhas copiadas, ${errors} erros)`);
        }
      }
      
      if (errors > 0) {
        this.logger.warn(`Tabela ${tableName}: ${rowsCopied} linhas copiadas, ${errors} erros ignorados`);
      }
      
      this.logger.log(`Tabela ${tableName}: ${rowsCopied} linhas copiadas via INSERT melhorado`);
      return { rowsCopied };
      
    } catch (error) {
      this.logger.error(`Erro geral ao copiar tabela ${tableName}:`, error);
      throw error;
    } finally {
      await sourceClient.end();
      await targetClient.end();
    }
  }


  /**
   * Limpa o banco de desenvolvimento antes da sincronização
   */
  private async cleanDevelopmentDatabase(config: pg.ClientConfig): Promise<void> {
    const client = new pg.Client(config);
    try {
      await client.connect();
      
      this.logger.log('🧹 Limpando banco de desenvolvimento...');
      
      // Desabilitar constraints temporariamente para limpeza
      await client.query('SET session_replication_role = replica;');
      
      // Ordem de limpeza (tabelas dependentes primeiro)
      const tablesToClean = [
        'pool_participants', 'pool_matches', 'match_broadcasts', 'goals', 'matches',
        'player_team_history', 'international_teams', 'competition_teams', 'pools',
        'users', 'teams', 'competitions', 'stadiums', 'players', 'rounds', 'channels', 'titles',
        'whatsapp_menu_configs', 'simulation_results', 'system_settings', 'bot_configs', 'migrations'
      ];
      
      for (const tableName of tablesToClean) {
        try {
          // Verificar se tabela existe antes de limpar
          const tableExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            );
          `, [tableName]);

          if (tableExists.rows[0].exists) {
            await client.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
            this.logger.log(`✅ Tabela ${tableName} limpa`);
          } else {
            this.logger.log(`⚠️  Tabela ${tableName} não existe, pulando...`);
          }
        } catch (error) {
          this.logger.warn(`⚠️  Erro ao limpar tabela ${tableName}: ${error.message}`);
        }
      }
      
      // Reabilitar constraints
      await client.query('SET session_replication_role = DEFAULT;');
      
      this.logger.log('✅ Banco de desenvolvimento limpo com sucesso');
      
    } finally {
      await client.end();
    }
  }

  /**
   * Desabilita temporariamente as constraints de chave estrangeira
   */
  private async disableForeignKeys(config: pg.ClientConfig): Promise<void> {
    const client = new pg.Client(config);
    try {
      await client.connect();
      
      // Desabilitar constraints de chave estrangeira
      await client.query('SET session_replication_role = replica;');
      
      // Desabilitar triggers temporariamente
      await client.query('SET session_replication_role = replica;');
      
      this.logger.log('Constraints de chave estrangeira e triggers desabilitados temporariamente');
    } finally {
      await client.end();
    }
  }

  /**
   * Reabilita as constraints de chave estrangeira
   */
  private async enableForeignKeys(config: pg.ClientConfig): Promise<void> {
    const client = new pg.Client(config);
    try {
      await client.connect();
      
      // Reabilitar constraints e triggers
      await client.query('SET session_replication_role = DEFAULT;');
      
      this.logger.log('Constraints de chave estrangeira e triggers reabilitados');
    } finally {
      await client.end();
    }
  }

  /**
   * Obtém a ordem correta de sincronização das tabelas baseada nas dependências
   */
  private getTableSyncOrder(tables: string[]): string[] {
    // Ordem específica para resolver dependências de chave estrangeira
    const orderedTables = [
      // Tabelas base (sem dependências)
      'typeorm_metadata',
      'system_settings',
      'competitions',
      'teams',
      'stadiums',
      'players',
      'rounds',
      'titles',
      'channels',

      // Tabelas que dependem de teams (ANTES de users e matches)
      'competition_teams',
      'international_teams',
      'player_team_history',

      // Tabelas que dependem de teams
      'users',

      // Tabelas que dependem de users
      'pools',

      // Tabelas que dependem de matches
      'matches',
      'goals',
      'broadcasts',
      'match_broadcasts',

      // Tabelas que dependem de pools e matches
      'pool_matches',
      'pool_participants',
      'pool_predictions',
      'simulation_results',
      'whatsapp_menu_configs'
    ];

    // Filtrar apenas as tabelas que existem na lista original
    const filteredOrder = orderedTables.filter(table => tables.includes(table));
    
    // Adicionar tabelas que não estão na lista ordenada (manter ordem original)
    const remainingTables = tables.filter(table => !orderedTables.includes(table));
    
    return [...filteredOrder, ...remainingTables];
  }

  /**
   * Sincroniza dados de produção para desenvolvimento usando lógica robusta
   */
  async syncFromProduction(): Promise<{
    success: boolean;
    message: string;
    details: {
      tablesProcessed: number;
      totalRowsCopied: number;
      tableResults: Array<{
        tableName: string;
        rowsCopied: number;
        success: boolean;
        error?: string;
      }>;
    };
  }> {
    // Verificar se estamos em desenvolvimento
    if (!this.isDevelopment()) {
      throw new BadRequestException('Sincronização só é permitida em ambiente de desenvolvimento');
    }

    // Verificar se temos credenciais de produção
    if (!process.env.PROD_DB_PASSWORD) {
      throw new BadRequestException('Credenciais de produção não configuradas (PROD_DB_PASSWORD)');
    }

    this.logger.log('🔄 Iniciando sincronização robusta de dados de produção para desenvolvimento');

    const productionConfig = this.getProductionConfig();
    const developmentConfig = this.getDevelopmentConfig();

    try {
      // 1. Limpeza prévia do banco de desenvolvimento
      this.logger.log('🧹 Limpando banco de desenvolvimento...');
      await this.cleanDevelopmentDatabase(developmentConfig);

      // 2. Ordem de sincronização robusta (respeitando dependências)
      const syncOrder = [
        'system_settings',
        'bot_configs', 
        'competitions',
        'stadiums',
        'teams', 
        'players',
        'rounds',
        'channels',
        'titles',
        'users',
        'matches',
        'goals',
        'competition_teams',
        'international_teams',
        'player_team_history',
        'pools',
        'pool_matches',
        'pool_participants',
        'match_broadcasts',
        'whatsapp_menu_configs',
        'simulation_results'
      ];

      const results = {
        tablesProcessed: 0,
        totalRowsCopied: 0,
        tableResults: [] as Array<{
          tableName: string;
          rowsCopied: number;
          success: boolean;
          error?: string;
        }>
      };

      // 3. Sincronizar cada tabela na ordem correta
      for (const tableName of syncOrder) {
        try {
          this.logger.log(`📋 Sincronizando: ${tableName}`);
          
          // Verificar se tabela existe na origem
          const tableExists = await this.executeQuery(productionConfig, `
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            );
          `, [tableName]);

          if (!tableExists[0].exists) {
            this.logger.log(`⚠️  Tabela ${tableName} não existe na origem, pulando...`);
            continue;
          }

          // Contar registros na origem
          const countResult = await this.executeQuery(productionConfig, `SELECT COUNT(*) as count FROM "${tableName}";`);
          const sourceCount = parseInt(countResult[0].count);
          
          if (sourceCount === 0) {
            this.logger.log(`📭 Tabela ${tableName} está vazia na origem`);
            continue;
          }

          this.logger.log(`📊 ${sourceCount} registros na origem`);

          // Buscar dados da origem
          const sourceData = await this.executeQuery(productionConfig, `SELECT * FROM "${tableName}";`);
          
          if (sourceData.length === 0) {
            this.logger.log(`📭 Nenhum dado retornado para ${tableName}`);
            continue;
          }

          // Obter colunas da tabela de destino
          const targetColumns = await this.getTargetTableColumns(developmentConfig, tableName);
          
          if (targetColumns.length === 0) {
            this.logger.warn(`⚠️  Nenhuma coluna encontrada para ${tableName} no destino`);
            continue;
          }

          // Filtrar colunas problemáticas
          let filteredColumns = targetColumns;
          
          // Remover colunas geradas
          if (tableName === 'competition_teams') {
            filteredColumns = filteredColumns.filter(col => col !== 'goal_difference');
          }

          // 4. Aplicar filtros de validação para chaves estrangeiras
          let validRows = sourceData;
          
          if (tableName === 'teams') {
            // Verificar se stadiums existem
            const stadiumIds = await this.executeQuery(developmentConfig, 'SELECT id FROM stadiums');
            const validStadiumIds = new Set(stadiumIds.map(row => row.id));
            
            validRows = sourceData.filter(row => {
              if (row.stadium_id && !validStadiumIds.has(row.stadium_id)) {
                this.logger.log(`⚠️  Removendo team ${row.name} - stadium_id ${row.stadium_id} não existe`);
                return false;
              }
              return true;
            });
          }
          
          if (tableName === 'competition_teams') {
            // Verificar se teams existem
            const teamIds = await this.executeQuery(developmentConfig, 'SELECT id FROM teams');
            const validTeamIds = new Set(teamIds.map(row => row.id));
            
            validRows = sourceData.filter(row => {
              if (!validTeamIds.has(row.team_id)) {
                this.logger.log(`⚠️  Removendo competition_team - team_id ${row.team_id} não existe`);
                return false;
              }
              return true;
            });
          }
          
          if (tableName === 'users') {
            // Verificar se teams existem para favorite_team_id
            const teamIds = await this.executeQuery(developmentConfig, 'SELECT id FROM teams');
            const validTeamIds = new Set(teamIds.map(row => row.id));
            
            validRows = sourceData.map(row => {
              if (row.favorite_team_id && !validTeamIds.has(row.favorite_team_id)) {
                this.logger.log(`⚠️  Definindo favorite_team_id como null para user ${row.name}`);
                row.favorite_team_id = null;
              }
              return row;
            });
          }
          
          if (tableName === 'matches') {
            // Verificar se teams existem para home_team_id e away_team_id
            const teamIds = await this.executeQuery(developmentConfig, 'SELECT id FROM teams');
            const validTeamIds = new Set(teamIds.map(row => row.id));
            
            validRows = sourceData.filter(row => {
              const homeTeamExists = !row.home_team_id || validTeamIds.has(row.home_team_id);
              const awayTeamExists = !row.away_team_id || validTeamIds.has(row.away_team_id);
              
              if (!homeTeamExists) {
                this.logger.log(`⚠️  Removendo match ${row.id} - home_team_id ${row.home_team_id} não existe`);
                return false;
              }
              
              if (!awayTeamExists) {
                this.logger.log(`⚠️  Removendo match ${row.id} - away_team_id ${row.away_team_id} não existe`);
                return false;
              }
              
              return true;
            });
            
            // Corrigir valores de enum inválidos
            validRows = validRows.map(row => {
              // Mapear status inválidos para válidos (a coluna se chama 'status', não 'match_status')
              // Valores válidos do enum: scheduled, live, finished, postponed, cancelled
              const statusMap = {
                'to_confirm': 'scheduled',
                'confirmed': 'scheduled',
                'in_progress': 'live',
                'completed': 'finished',  // Corrigido: completed -> finished
                'finished': 'finished',
                'postponed': 'postponed',
                'cancelled': 'cancelled'
              };
              
              if (row.status && statusMap[row.status]) {
                this.logger.log(`⚠️  Corrigindo status ${row.status} para ${statusMap[row.status]} no match ${row.id}`);
                row.status = statusMap[row.status];
              } else if (row.status && !['scheduled', 'live', 'finished', 'postponed', 'cancelled'].includes(row.status)) {
                this.logger.log(`⚠️  Definindo status padrão 'scheduled' para match ${row.id} (status inválido: ${row.status})`);
                row.status = 'scheduled';
              }
              
              return row;
            });
          }

          if (validRows.length === 0) {
            this.logger.log(`⚠️  Nenhum registro válido para ${tableName} após filtros`);
            continue;
          }

          // 5. Preparar query de inserção com upsert
          const placeholders = filteredColumns.map((_, index) => `$${index + 1}`).join(', ');
          
          // Usar UPSERT para tabelas com chaves únicas
          let insertQuery: string;
          if (['system_settings', 'bot_configs', 'whatsapp_menu_configs', 'migrations'].includes(tableName)) {
            // Para tabelas com chaves únicas, usar ON CONFLICT
            const keyColumn = tableName === 'system_settings' ? 'key' : 
                             tableName === 'bot_configs' ? 'key' : 
                             tableName === 'whatsapp_menu_configs' ? 'id' : 'id';
            
            const updateColumns = filteredColumns.filter(col => col !== keyColumn);
            const updateSet = updateColumns.map(col => `"${col}" = EXCLUDED."${col}"`).join(', ');
            
            insertQuery = `
              INSERT INTO "${tableName}" (${filteredColumns.map(col => `"${col}"`).join(', ')}) 
              VALUES (${placeholders})
              ON CONFLICT ("${keyColumn}") 
              DO UPDATE SET ${updateSet};
            `;
          } else {
            // Para outras tabelas, usar INSERT simples
            insertQuery = `INSERT INTO "${tableName}" (${filteredColumns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders});`;
          }

          let insertedCount = 0;
          let errorCount = 0;

          // 6. Inserir dados em lotes
          const batchSize = 100;
          for (let i = 0; i < validRows.length; i += batchSize) {
            const batch = validRows.slice(i, i + batchSize);
            
            for (const row of batch) {
              try {
                // Preparar valores apenas com colunas válidas
                const values = filteredColumns.map(col => {
                  const value = row[col];
                  
                  // Tratamento especial para campos JSON na tabela matches
                  if (tableName === 'matches') {
                    const jsonFields = ['broadcast_channels', 'match_stats', 'home_team_player_stats', 'away_team_player_stats'];
                    
                    if (jsonFields.includes(col)) {
                      if (value === null || value === undefined) {
                        return null;
                      }
                      
                      if (typeof value === 'string') {
                        // Se já é string, verificar se é JSON válido
                        try {
                          JSON.parse(value);
                          return value;
                        } catch (e) {
                          // Se não é JSON válido, retornar array vazio ou objeto vazio
                          if (col === 'broadcast_channels') {
                            return '[]';
                          } else {
                            return '{}';
                          }
                        }
                      }
                      
                      if (Array.isArray(value)) {
                        try {
                          return JSON.stringify(value);
                        } catch (e) {
                          return '[]';
                        }
                      }
                      
                      if (typeof value === 'object') {
                        try {
                          return JSON.stringify(value);
                        } catch (e) {
                          return '{}';
                        }
                      }
                      
                      return value;
                    }
                  }
                  
                  // Tratamento geral para outros campos JSON
                  if (value && typeof value === 'object' && !Array.isArray(value)) {
                    try {
                      return JSON.stringify(value);
                    } catch (error) {
                      this.logger.warn(`⚠️  Erro ao converter JSON em ${col}: ${error.message}`);
                      return '{}';
                    }
                  } else if (Array.isArray(value)) {
                    try {
                      return JSON.stringify(value);
                    } catch (error) {
                      this.logger.warn(`⚠️  Erro ao converter array em ${col}: ${error.message}`);
                      return '[]';
                    }
                  }
                  
                  return value;
                });

                await this.executeQuery(developmentConfig, insertQuery, values);
                insertedCount++;
                
              } catch (error) {
                errorCount++;
                
                // Log apenas os primeiros erros
                if (errorCount <= 3) {
                  this.logger.error(`❌ Erro ao inserir em ${tableName}: ${error.message}`);
                }
                
                // Parar se muitos erros
                if (errorCount > 50) {
                  this.logger.error(`🛑 Muitos erros em ${tableName}, parando inserção`);
                  break;
                }
              }
            }
            
            // Progresso para tabelas grandes
            if (validRows.length > 100) {
              const progress = Math.round((i / validRows.length) * 100);
              this.logger.log(`⏳ ${tableName}: ${progress}% (${insertedCount} inseridos, ${errorCount} erros)`);
            }
          }

          this.logger.log(`✅ ${tableName}: ${insertedCount} registros inseridos, ${errorCount} erros`);
          
          results.tableResults.push({
            tableName,
            rowsCopied: insertedCount,
            success: true
          });
          
          results.tablesProcessed++;
          results.totalRowsCopied += insertedCount;

        } catch (error) {
          this.logger.error(`💥 Erro ao sincronizar ${tableName}: ${error.message}`);
          
          results.tableResults.push({
            tableName,
            rowsCopied: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      this.logger.log(`🎉 Sincronização concluída! Total: ${results.totalRowsCopied} registros inseridos`);

      return {
        success: true,
        message: `Sincronização robusta concluída! ${results.tablesProcessed} tabelas processadas, ${results.totalRowsCopied} registros inseridos.`,
        details: results
      };

    } catch (error) {
      this.logger.error('💥 Erro fatal durante sincronização:', error);
      throw new BadRequestException(`Erro durante sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verifica status da conexão com produção
   */
  async checkProductionConnection(): Promise<{
    success: boolean;
    message: string;
    details?: {
      tablesCount: number;
      sampleTables: string[];
    };
  }> {
    if (!this.isDevelopment()) {
      throw new BadRequestException('Verificação só é permitida em ambiente de desenvolvimento');
    }

    if (!process.env.PROD_DB_PASSWORD) {
      return {
        success: false,
        message: 'Credenciais de produção não configuradas (PROD_DB_PASSWORD)'
      };
    }

    try {
      const productionConfig = this.getProductionConfig();
      const tables = await this.getTables(productionConfig);
      
      return {
        success: true,
        message: `Conexão com produção estabelecida com sucesso! ${tables.length} tabelas encontradas.`,
        details: {
          tablesCount: tables.length,
          sampleTables: tables.slice(0, 10) // Primeiras 10 tabelas como exemplo
        }
      };
      
    } catch (error) {
      this.logger.error('Erro ao conectar com produção:', error);
      return {
        success: false,
        message: `Erro ao conectar com produção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Testa sincronização de uma tabela específica (para debug)
   */
  async testTableSync(tableName: string): Promise<{
    success: boolean;
    message: string;
    details: {
      tableName: string;
      rowsCopied: number;
      error?: string;
    };
  }> {
    if (!this.isDevelopment()) {
      throw new BadRequestException('Teste só é permitido em ambiente de desenvolvimento');
    }

    if (!process.env.PROD_DB_PASSWORD) {
      throw new BadRequestException('Credenciais de produção não configuradas (PROD_DB_PASSWORD)');
    }

    this.logger.log(`Testando sincronização da tabela: ${tableName}`);

    const productionConfig = this.getProductionConfig();
    const developmentConfig = this.getDevelopmentConfig();

    try {
      // Verificar se a tabela existe na origem
      const tables = await this.getTables(productionConfig);
      if (!tables.includes(tableName)) {
        return {
          success: false,
          message: `Tabela ${tableName} não encontrada na origem`,
          details: {
            tableName,
            rowsCopied: 0,
            error: 'Tabela não encontrada'
          }
        };
      }

      // Desabilitar constraints temporariamente
      await this.disableForeignKeys(developmentConfig);

      // Sincronizar tabela
      const result = await this.copyTableData(productionConfig, developmentConfig, tableName);

      // Reabilitar constraints
      await this.enableForeignKeys(developmentConfig);

      return {
        success: true,
        message: `Tabela ${tableName} sincronizada com sucesso`,
        details: {
          tableName,
          rowsCopied: result.rowsCopied
        }
      };

    } catch (error) {
      this.logger.error(`Erro ao testar tabela ${tableName}:`, error);
      
      // Tentar reabilitar constraints mesmo em caso de erro
      try {
        await this.enableForeignKeys(developmentConfig);
      } catch (enableError) {
        this.logger.error('Erro ao reabilitar constraints:', enableError);
      }

      return {
        success: false,
        message: `Erro ao sincronizar tabela ${tableName}`,
        details: {
          tableName,
          rowsCopied: 0,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      };
    }
  }

  /**
   * Obtém informações sobre o ambiente atual
   */
  getEnvironmentInfo(): {
    currentEnvironment: string;
    isDevelopment: boolean;
    hasProductionCredentials: boolean;
    developmentDatabase: string;
    productionDatabase: string;
  } {
    return {
      currentEnvironment: process.env.NODE_ENV || 'development',
      isDevelopment: this.isDevelopment(),
      hasProductionCredentials: !!process.env.PROD_DB_PASSWORD,
      developmentDatabase: process.env.DB_DATABASE || 'kmiza27_dev',
      productionDatabase: 'kmiza27'
    };
  }
}
