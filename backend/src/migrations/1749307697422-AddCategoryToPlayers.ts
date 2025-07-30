import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToPlayers1749307697422 implements MigrationInterface {
    name = 'AddCategoryToPlayers1749307697422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Verificar se a coluna já existe
            const columnExists = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'players' AND column_name = 'category'
            `);

            // Só adicionar a coluna se ela não existir
            if (columnExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "players" ADD "category" character varying(50) DEFAULT 'professional'`);
                
                // Atualizar jogadores existentes
                await queryRunner.query(`UPDATE "players" SET "category" = 'professional' WHERE "category" IS NULL`);
            }
        } catch (error) {
            console.log('Migration AddCategoryToPlayers: Coluna category já existe ou erro:', error.message);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "category"`);
        } catch (error) {
            console.log('Migration AddCategoryToPlayers down: Erro ao remover coluna:', error.message);
        }
    }
} 