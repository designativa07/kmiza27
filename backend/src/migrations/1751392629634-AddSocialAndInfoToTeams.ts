import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialAndInfoToTeams1751392629634 implements MigrationInterface {
    name = 'AddSocialAndInfoToTeams1751392629634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "history" text`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "information" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "information"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "history"`);
    }

} 