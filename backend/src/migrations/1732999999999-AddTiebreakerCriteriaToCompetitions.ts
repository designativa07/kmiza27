import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTiebreakerCriteriaToCompetitions1732999999999 implements MigrationInterface {
  name = 'AddTiebreakerCriteriaToCompetitions1732999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'competitions',
      new TableColumn({
        name: 'tiebreaker_criteria',
        type: 'jsonb',
        isNullable: true,
        comment: 'Critérios de desempate e classificação da competição'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('competitions', 'tiebreaker_criteria');
  }
} 