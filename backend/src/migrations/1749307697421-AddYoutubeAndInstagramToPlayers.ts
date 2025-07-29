import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYoutubeAndInstagramToPlayers1749307697421 implements MigrationInterface {
    name = 'AddYoutubeAndInstagramToPlayers1749307697421'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna youtube_url
        await queryRunner.query(`ALTER TABLE "players" ADD "youtube_url" character varying(255)`);
        
        // Adicionar coluna instagram_url
        await queryRunner.query(`ALTER TABLE "players" ADD "instagram_url" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover coluna instagram_url
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "instagram_url"`);
        
        // Remover coluna youtube_url
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "youtube_url"`);
    }
} 