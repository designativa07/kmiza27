import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSystemSettingValueType1752695000000 implements MigrationInterface {
    name = 'UpdateSystemSettingValueType1752695000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Alterar o tipo da coluna 'value' para TEXT
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "value" text`);

        // Log para confirmar que a migração foi executada
        console.log('Migration UP: Coluna "value" da tabela "system_settings" alterada para TEXT.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter a alteração (de TEXT para JSONB)
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "value" jsonb`);

        // Log para confirmar que o rollback foi executado
        console.log('Migration DOWN: Coluna "value" da tabela "system_settings" revertida para JSONB.');
    }

} 