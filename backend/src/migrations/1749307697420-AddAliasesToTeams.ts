import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAliasesToTeams1749307697420 implements MigrationInterface {
    name = 'AddAliasesToTeams1749307697420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "aliases" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "aliases"`);
    }
} 