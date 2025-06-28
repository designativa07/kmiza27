import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStadiumHistoryAndImage1749518001000 implements MigrationInterface {
    name = 'AddStadiumHistoryAndImage1749518001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableName = "stadiums";

        // Add 'opened_year' if it doesn't exist
        const hasOpenedYear = await queryRunner.hasColumn(tableName, "opened_year");
        if (!hasOpenedYear) {
            await queryRunner.query(`ALTER TABLE "${tableName}" ADD "opened_year" integer`);
        }

        // Add 'history' if it doesn't exist
        const hasHistory = await queryRunner.hasColumn(tableName, "history");
        if (!hasHistory) {
            await queryRunner.query(`ALTER TABLE "${tableName}" ADD "history" text`);
        }

        // Add 'image_url' if it doesn't exist
        const hasImageUrl = await queryRunner.hasColumn(tableName, "image_url");
        if (!hasImageUrl) {
            await queryRunner.query(`ALTER TABLE "${tableName}" ADD "image_url" character varying(500)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tableName = "stadiums";

        // Drop 'image_url' if it exists
        const hasImageUrl = await queryRunner.hasColumn(tableName, "image_url");
        if (hasImageUrl) {
            await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "image_url"`);
        }

        // Drop 'history' if it exists
        const hasHistory = await queryRunner.hasColumn(tableName, "history");
        if (hasHistory) {
            await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "history"`);
        }

        // Drop 'opened_year' if it exists
        const hasOpenedYear = await queryRunner.hasColumn(tableName, "opened_year");
        if (hasOpenedYear) {
            await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "opened_year"`);
        }
    }
} 