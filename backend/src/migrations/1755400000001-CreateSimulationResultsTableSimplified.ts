import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSimulationResultsTableSimplified1755400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela simulation_results
    await queryRunner.query(`
      CREATE TABLE "simulation_results" (
        "id" SERIAL NOT NULL,
        "competition_id" int NOT NULL,
        "execution_date" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "simulation_count" int NOT NULL,
        "executed_by" varchar(100) NOT NULL,
        "is_latest" boolean NOT NULL DEFAULT false,
        "power_index_data" jsonb NOT NULL,
        "simulation_results" jsonb NOT NULL,
        "metadata" jsonb NOT NULL,
        "execution_duration_ms" int NOT NULL,
        "algorithm_version" varchar(50) NOT NULL DEFAULT '1.0.0',
        CONSTRAINT "PK_simulation_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_simulation_results_competition" FOREIGN KEY ("competition_id") 
          REFERENCES "competitions" ("id") ON DELETE CASCADE
      );
    `);

    // Comentários nas colunas
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."simulation_count" IS 'Número de simulações executadas (1-10000)';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."executed_by" IS 'Usuário administrador que executou a simulação';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."is_latest" IS 'Flag para marcar a simulação mais recente de cada competição';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."power_index_data" IS 'Dados do Power Index de cada time no momento da simulação';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."simulation_results" IS 'Resultados das probabilidades calculadas para cada time';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."metadata" IS 'Metadados da execução (duração, versão do algoritmo, etc.)';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."execution_duration_ms" IS 'Duração da execução em milissegundos';
    `);
    
    await queryRunner.query(`
      COMMENT ON COLUMN "simulation_results"."algorithm_version" IS 'Versão do algoritmo usado na simulação';
    `);

    // Índices para melhor performance
    await queryRunner.query(`
      CREATE INDEX "IDX_simulation_results_competition_execution_date" 
      ON "simulation_results" ("competition_id", "execution_date");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_simulation_results_competition_latest" 
      ON "simulation_results" ("competition_id", "is_latest");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_simulation_results_execution_date" 
      ON "simulation_results" ("execution_date");
    `);

    // Comentário da tabela
    await queryRunner.query(`
      COMMENT ON TABLE "simulation_results" IS 'Histórico de simulações Monte Carlo para previsões de campeonatos';
    `);

    // Criar trigger para garantir que apenas uma simulação por competição seja marcada como 'latest'
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_simulation_latest_flag()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Se a nova simulação está sendo marcada como latest
        IF NEW.is_latest = TRUE THEN
          -- Desmarcar todas as outras simulações da mesma competição
          UPDATE simulation_results 
          SET is_latest = FALSE 
          WHERE competition_id = NEW.competition_id 
            AND id != NEW.id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_simulation_latest_flag
        BEFORE INSERT OR UPDATE ON simulation_results
        FOR EACH ROW
        EXECUTE FUNCTION update_simulation_latest_flag();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger e função
    await queryRunner.query('DROP TRIGGER IF EXISTS trigger_simulation_latest_flag ON simulation_results;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_simulation_latest_flag();');

    // Remover índices
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_simulation_results_competition_execution_date";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_simulation_results_competition_latest";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_simulation_results_execution_date";');

    // Remover tabela
    await queryRunner.query('DROP TABLE IF EXISTS "simulation_results";');
  }
}
