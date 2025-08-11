import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInternationalTeamsTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela (idempotente)
    await queryRunner.createTable(
      new Table({
        name: 'international_teams',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'team_id', type: 'int', isNullable: false },
          { name: 'display_order', type: 'int', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Buscar metadados da tabela para checar índices/FKs existentes
    const table = await queryRunner.getTable('international_teams');

    // Criar índice único para team_id somente se ainda não existir
    const hasTeamIdIndex = table?.indices?.some((i) => i.name === 'IDX_international_teams_team_id');
    if (!hasTeamIdIndex) {
      await queryRunner.createIndex(
        'international_teams',
        new TableIndex({
          name: 'IDX_international_teams_team_id',
          columnNames: ['team_id'],
          isUnique: true,
        }),
      );
    }

    // Criar índice de ordenação somente se ainda não existir
    const hasOrderIndex = table?.indices?.some((i) => i.name === 'IDX_international_teams_display_order');
    if (!hasOrderIndex) {
      await queryRunner.createIndex(
        'international_teams',
        new TableIndex({
          name: 'IDX_international_teams_display_order',
          columnNames: ['display_order'],
        }),
      );
    }

    // Adicionar foreign key para teams apenas se não existir
    const hasTeamFk = table?.foreignKeys?.some(
      (fk) => fk.columnNames.includes('team_id') && fk.referencedTableName === 'teams',
    );
    if (!hasTeamFk) {
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
