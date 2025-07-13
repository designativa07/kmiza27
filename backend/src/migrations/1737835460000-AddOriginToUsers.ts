import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginToUsers1737835460000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a coluna já existe
        const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'origin'
        `);

        // Só adicionar a coluna se ela não existir
        if (columnExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                ADD COLUMN "origin" VARCHAR(20) NOT NULL DEFAULT 'whatsapp'
            `);
            
            // Comentário para documentar a migração
            await queryRunner.query(`
                COMMENT ON COLUMN "users"."origin" IS 'Origem do usuário: whatsapp ou site'
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a coluna existe antes de tentar removê-la
        const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'origin'
        `);

        if (columnExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                DROP COLUMN "origin"
            `);
        }
    }
} 