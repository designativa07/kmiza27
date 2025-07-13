import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginToUsers1737835460000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "origin" VARCHAR(20) NOT NULL DEFAULT 'whatsapp'
        `);
        
        // Comentário para documentar a migração
        await queryRunner.query(`
            COMMENT ON COLUMN "users"."origin" IS 'Origem do usuário: whatsapp ou site'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "origin"
        `);
    }
} 