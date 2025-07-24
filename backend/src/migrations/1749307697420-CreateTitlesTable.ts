import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTitlesTable1749307697420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'titles',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'competition_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'season',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'year',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'team_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Adicionar foreign key
    await queryRunner.createForeignKey(
      'titles',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('titles');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('team_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('titles', foreignKey);
      }
    }
    await queryRunner.dropTable('titles');
  }
} 