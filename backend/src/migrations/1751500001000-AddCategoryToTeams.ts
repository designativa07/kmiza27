import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToTeams1751500001000 implements MigrationInterface {
  name = 'AddCategoryToTeams1751500001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'category'
    `);

    // Só adicionar a coluna se ela não existir
    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "teams" 
        ADD COLUMN "category" VARCHAR(50) NOT NULL DEFAULT 'professional'
      `);
      
      // Adicionar comentário na coluna
      await queryRunner.query(`
        COMMENT ON COLUMN "teams"."category" IS 'Categoria do time: professional ou amateur'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teams" 
      DROP COLUMN "category"
    `);
  }
} 