import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToCompetitions1751500000000 implements MigrationInterface {
  name = 'AddCategoryToCompetitions1751500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' AND column_name = 'category'
    `);

    // Só adicionar a coluna se ela não existir
    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "competitions" 
        ADD COLUMN "category" VARCHAR(50) NOT NULL DEFAULT 'professional'
      `);
      
      // Adicionar comentário na coluna
      await queryRunner.query(`
        COMMENT ON COLUMN "competitions"."category" IS 'Categoria da competição: professional ou amateur'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "competitions" 
      DROP COLUMN "category"
    `);
  }
} 