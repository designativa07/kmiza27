import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegulamentoToCompetitions1751450000000 implements MigrationInterface {
  name = 'AddRegulamentoToCompetitions1751450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "competitions" 
      ADD COLUMN "regulamento" TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "competitions" 
      DROP COLUMN "regulamento"
    `);
  }
} 