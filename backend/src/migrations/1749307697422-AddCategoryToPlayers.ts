import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToPlayers1749307697422 implements MigrationInterface {
    name = 'AddCategoryToPlayers1749307697422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna category
        await queryRunner.query(`ALTER TABLE "players" ADD "category" character varying(50) DEFAULT 'professional'`);
        
        // Atualizar jogadores existentes
        await queryRunner.query(`UPDATE "players" SET "category" = 'professional' WHERE "category" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover coluna category
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "category"`);
    }
} 