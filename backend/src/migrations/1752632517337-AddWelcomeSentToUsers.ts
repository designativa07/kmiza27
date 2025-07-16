import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWelcomeSentToUsers1752632517337 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna welcome_sent na tabela users
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "welcome_sent" boolean DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover coluna welcome_sent da tabela users
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "welcome_sent"
        `);
    }

}
