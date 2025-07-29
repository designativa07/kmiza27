import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisplayOrderToCompetitions1749307697420 implements MigrationInterface {
    name = 'AddDisplayOrderToCompetitions1749307697420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "competitions" ADD "display_order" integer NOT NULL DEFAULT '0'`);
        
        // Definir ordem inicial baseada no ID para competições existentes
        await queryRunner.query(`
            UPDATE "competitions" 
            SET "display_order" = id 
            WHERE "display_order" = 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "competitions" DROP COLUMN "display_order"`);
    }
}