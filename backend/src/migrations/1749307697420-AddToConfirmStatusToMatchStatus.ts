import { MigrationInterface, QueryRunner } from "typeorm";

export class AddToConfirmStatusToMatchStatus1749307697420 implements MigrationInterface {
    name = 'AddToConfirmStatusToMatchStatus1749307697420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar o novo valor 'to_confirm' ao enum match_status
        await queryRunner.query(`
            ALTER TYPE "public"."match_status" ADD VALUE 'to_confirm'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL não suporta remoção de valores de enum diretamente
        // Seria necessário recriar o tipo, mas isso pode causar problemas
        // Por isso, deixamos o valor no banco em caso de rollback
        console.log('Warning: Cannot remove enum value "to_confirm" from match_status. Manual intervention may be required.');
    }
}
