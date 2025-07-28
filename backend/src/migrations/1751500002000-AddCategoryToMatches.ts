import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToMatches1751500002000 implements MigrationInterface {
  name = 'AddCategoryToMatches1751500002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'matches' AND column_name = 'category'
    `);

    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "matches"
        ADD COLUMN "category" VARCHAR(50) NOT NULL DEFAULT 'professional'
      `);
      await queryRunner.query(`
        COMMENT ON COLUMN "matches"."category" IS 'Categoria da partida: professional ou amateur'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "matches"
      DROP COLUMN "category"
    `);
  }
} 