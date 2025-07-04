import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisplayOrderToRounds1751400000000 implements MigrationInterface {
    name = 'AddDisplayOrderToRounds1751400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rounds" ADD "display_order" integer NOT NULL DEFAULT 0`);
        
        // Atualizar display_order baseado no round_number existente para dados já cadastrados
        await queryRunner.query(`UPDATE "rounds" SET "display_order" = COALESCE("round_number", 0) WHERE "display_order" = 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rounds" DROP COLUMN "display_order"`);
    }
} 