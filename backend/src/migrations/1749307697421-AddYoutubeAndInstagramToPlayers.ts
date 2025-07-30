import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYoutubeAndInstagramToPlayers1749307697421 implements MigrationInterface {
    name = 'AddYoutubeAndInstagramToPlayers1749307697421'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Verificar se as colunas já existem
            const youtubeExists = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'players' AND column_name = 'youtube_url'
            `);

            const instagramExists = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'players' AND column_name = 'instagram_url'
            `);

            // Só adicionar as colunas se elas não existirem
            if (youtubeExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "players" ADD "youtube_url" character varying(255)`);
            }

            if (instagramExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "players" ADD "instagram_url" character varying(255)`);
            }
        } catch (error) {
            console.log('Migration AddYoutubeAndInstagramToPlayers: Colunas já existem ou erro:', error.message);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // Verificar se as colunas existem antes de tentar removê-las
            const instagramExists = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'players' AND column_name = 'instagram_url'
            `);

            const youtubeExists = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'players' AND column_name = 'youtube_url'
            `);

            if (instagramExists.length > 0) {
                await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "instagram_url"`);
            }

            if (youtubeExists.length > 0) {
                await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "youtube_url"`);
            }
        } catch (error) {
            console.log('Migration AddYoutubeAndInstagramToPlayers down: Erro ao remover colunas:', error.message);
        }
    }
} 