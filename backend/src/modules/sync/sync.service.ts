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
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
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
   * Copia dados de uma tabela entre bancos
   */
  private async copyTableData(
    sourceConfig: pg.ClientConfig,
    targetConfig: pg.ClientConfig,
    tableName: string
  ): Promise<{ rowsCopied: number }> {
    // 1. Obter dados da tabela origem
    const sourceClient = new pg.Client(sourceConfig);
    const targetClient = new pg.Client(targetConfig);
    
    try {
      await sourceClient.connect();
      await targetClient.connect();
      
      // 2. Obter estrutura da tabela
      const structure = await this.getTableStructure(sourceConfig, tableName);
      const columns = structure.map(col => col.column_name);
      
      // 3. Buscar todos os dados da tabela origem
      const selectQuery = `SELECT * FROM "${tableName}";`;
      const sourceResult = await sourceClient.query(selectQuery);
      
      if (sourceResult.rows.length === 0) {
        return { rowsCopied: 0 };
      }
      
      // 4. Limpar tabela destino
      await this.truncateTable(targetConfig, tableName);
      
      // 5. Inserir dados na tabela destino
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const insertQuery = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders});`;
      
      let rowsCopied = 0;
      for (const row of sourceResult.rows) {
        const values = columns.map(col => row[col]);
        await targetClient.query(insertQuery, values);
        rowsCopied++;
      }
      
      return { rowsCopied };
      
    } finally {
      await sourceClient.end();
      await targetClient.end();
    }
  }

  /**
   * Sincroniza dados de produção para desenvolvimento
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

    this.logger.log('Iniciando sincronização de dados de produção para desenvolvimento');

    const productionConfig = this.getProductionConfig();
    const developmentConfig = this.getDevelopmentConfig();

    try {
      // 1. Obter lista de tabelas
      const tables = await this.getTables(productionConfig);
      this.logger.log(`Encontradas ${tables.length} tabelas para sincronizar`);

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

      // 2. Processar cada tabela
      for (const tableName of tables) {
        try {
          this.logger.log(`Sincronizando tabela: ${tableName}`);
          
          const result = await this.copyTableData(productionConfig, developmentConfig, tableName);
          
          results.tableResults.push({
            tableName,
            rowsCopied: result.rowsCopied,
            success: true
          });
          
          results.tablesProcessed++;
          results.totalRowsCopied += result.rowsCopied;
          
          this.logger.log(`Tabela ${tableName}: ${result.rowsCopied} linhas copiadas`);
          
        } catch (error) {
          this.logger.error(`Erro ao sincronizar tabela ${tableName}:`, error);
          
          results.tableResults.push({
            tableName,
            rowsCopied: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      this.logger.log(`Sincronização concluída: ${results.tablesProcessed} tabelas processadas, ${results.totalRowsCopied} linhas copiadas`);

      return {
        success: true,
        message: `Sincronização concluída com sucesso! ${results.tablesProcessed} tabelas processadas, ${results.totalRowsCopied} linhas copiadas.`,
        details: results
      };

    } catch (error) {
      this.logger.error('Erro durante sincronização:', error);
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
