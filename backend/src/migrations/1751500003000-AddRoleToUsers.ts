import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUsers1751500003000 implements MigrationInterface {
  name = 'AddRoleToUsers1751500003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    `);

    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "role" VARCHAR(50) NOT NULL DEFAULT 'user'
      `);
      await queryRunner.query(`
        COMMENT ON COLUMN "users"."role" IS 'Role do usuário: admin, user, amateur'
      `);
      
      // Atualizar usuários existentes
      await queryRunner.query(`
        UPDATE users SET role = 'admin' WHERE is_admin = true
      `);
      await queryRunner.query(`
        UPDATE users SET role = 'user' WHERE is_admin = false AND role IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "role"
    `);
  }
} 