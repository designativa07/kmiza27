import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInternationalTeamsTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'international_teams',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'team_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'display_order',
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
          },
        ],
      }),
      true,
    );

    // Criar índice único para team_id
    await queryRunner.createIndex(
      'international_teams',
      new TableIndex({
        name: 'IDX_international_teams_team_id',
        columnNames: ['team_id'],
        isUnique: true,
      }),
    );

    // Criar índice para display_order
    await queryRunner.createIndex(
      'international_teams',
      new TableIndex({
        name: 'IDX_international_teams_display_order',
        columnNames: ['display_order'],
      }),
    );

    // Adicionar foreign key para teams
    await queryRunner.createForeignKey(
      'international_teams',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key
    const table = await queryRunner.getTable('international_teams');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('team_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('international_teams', foreignKey);
      }
    }

    // Remover índices
    await queryRunner.dropIndex('international_teams', 'IDX_international_teams_team_id');
    await queryRunner.dropIndex('international_teams', 'IDX_international_teams_display_order');

    // Remover tabela
    await queryRunner.dropTable('international_teams');
  }
}
