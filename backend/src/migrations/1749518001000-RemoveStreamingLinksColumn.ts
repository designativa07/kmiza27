import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveStreamingLinksColumn1749518001000 implements MigrationInterface {
  name = 'RemoveStreamingLinksColumn1749518001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove a coluna streaming_links da tabela matches
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN IF EXISTS "streaming_links"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaura a coluna streaming_links (rollback)
    await queryRunner.query(`ALTER TABLE "matches" ADD "streaming_links" jsonb`);
  }
} 