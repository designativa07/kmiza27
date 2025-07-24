import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialMediaToPlayers1749307697419 implements MigrationInterface {
    name = 'AddSocialMediaToPlayers1749307697419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "players" ADD "youtube_url" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "players" ADD "instagram_url" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "instagram_url"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "youtube_url"`);
    }
} 