import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddShortCodeToTeams1749518000000 implements MigrationInterface {
  name = 'AddShortCodeToTeams1749518000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe antes de tentar adicioná-la
    const table = await queryRunner.getTable('teams');
    const shortCodeColumn = table?.findColumnByName('short_code');
    
    if (!shortCodeColumn) {
      await queryRunner.addColumn('teams', new TableColumn({
        name: 'short_code',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna existe antes de tentar removê-la
    const table = await queryRunner.getTable('teams');
    const shortCodeColumn = table?.findColumnByName('short_code');
    
    if (shortCodeColumn) {
      await queryRunner.dropColumn('teams', 'short_code');
    }
  }
} 