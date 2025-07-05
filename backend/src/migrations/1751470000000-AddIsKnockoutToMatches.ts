import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsKnockoutToMatches1751470000000 implements MigrationInterface {
  name = 'AddIsKnockoutToMatches1751470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const columnExists = await queryRunner.hasColumn('matches', 'is_knockout');
    
    if (!columnExists) {
      // Adicionar coluna is_knockout com valor padrão false
      await queryRunner.query(`
        ALTER TABLE "matches" 
        ADD COLUMN "is_knockout" boolean NOT NULL DEFAULT false
      `);
      
      // Atualizar partidas existentes que são mata-mata baseado em critérios existentes
      await queryRunner.query(`
        UPDATE "matches" 
        SET "is_knockout" = true 
        WHERE "leg" IN ('first_leg', 'second_leg') 
           OR "tie_id" IS NOT NULL
           OR "phase" IN ('Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final', 'Disputa do 3º lugar')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna existe antes de tentar remover
    const columnExists = await queryRunner.hasColumn('matches', 'is_knockout');
    
    if (columnExists) {
      await queryRunner.query(`
        ALTER TABLE "matches" 
        DROP COLUMN "is_knockout"
      `);
    }
  }
} 