import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegulamentoToCompetitions1751450000000 implements MigrationInterface {
  name = 'AddRegulamentoToCompetitions1751450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' AND column_name = 'regulamento'
    `);

    // Só adicionar a coluna se ela não existir
    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "competitions" 
        ADD COLUMN "regulamento" TEXT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "competitions" 
      DROP COLUMN "regulamento"
    `);
  }
} 