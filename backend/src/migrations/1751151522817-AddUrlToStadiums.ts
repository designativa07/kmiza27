import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUrlToStadiums1751151522817 implements MigrationInterface {
  name = 'AddUrlToStadiums1751151522817';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'stadiums',
      new TableColumn({
        name: 'url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('stadiums', 'url');
  }
} 