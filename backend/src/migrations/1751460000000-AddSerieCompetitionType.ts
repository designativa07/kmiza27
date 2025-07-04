import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSerieCompetitionType1751460000000 implements MigrationInterface {
  name = 'AddSerieCompetitionType1751460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "competition_type" ADD VALUE 'serie'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Não é possível remover um valor de um enum em PostgreSQL
    // seria necessário recriar o enum e a tabela
    throw new Error('Cannot remove enum value in PostgreSQL');
  }
} 