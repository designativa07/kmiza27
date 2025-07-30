import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisplayOrderToCompetitions1749307697420 implements MigrationInterface {
    name = 'AddDisplayOrderToCompetitions1749307697420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Verificar se a coluna já existe antes de adicionar
            const hasColumn = await queryRunner.hasColumn('competitions', 'display_order');
            
            if (!hasColumn) {
                await queryRunner.query(`ALTER TABLE "competitions" ADD "display_order" integer NOT NULL DEFAULT '0'`);
                
                // Definir ordem inicial baseada no ID para competições existentes
                await queryRunner.query(`
                    UPDATE "competitions" 
                    SET "display_order" = id 
                    WHERE "display_order" = 0
                `);
            }
        } catch (error) {
            console.log('Migration AddDisplayOrderToCompetitions: Coluna display_order já existe ou erro:', error.message);
            // Não falhar se a coluna já existir
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            // Verificar se a coluna existe antes de tentar removê-la
            const hasColumn = await queryRunner.hasColumn('competitions', 'display_order');
            
            if (hasColumn) {
                await queryRunner.query(`ALTER TABLE "competitions" DROP COLUMN "display_order"`);
            }
        } catch (error) {
            console.log('Migration AddDisplayOrderToCompetitions down: Erro ao remover coluna:', error.message);
        }
    }
}