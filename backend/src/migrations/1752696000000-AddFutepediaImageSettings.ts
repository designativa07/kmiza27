import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFutepediaImageSettings1752696000000 implements MigrationInterface {
  name = 'AddFutepediaImageSettings1752696000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se as configurações já existem
    const existingSettings = await queryRunner.query(`
      SELECT key FROM system_settings 
      WHERE key IN ('futepedia_og_image_url', 'futepedia_header_logo_url')
    `);

    const existingKeys = existingSettings.map((row: any) => row.key);

    // Inserir configurações padrão se não existirem
    const settingsToInsert: Array<{key: string, value: string | null, description: string}> = [];

    if (!existingKeys.includes('futepedia_og_image_url')) {
      settingsToInsert.push({
        key: 'futepedia_og_image_url',
        value: null,
        description: 'URL da imagem Open Graph padrão para a Futepédia'
      });
    }

    if (!existingKeys.includes('futepedia_header_logo_url')) {
      settingsToInsert.push({
        key: 'futepedia_header_logo_url', 
        value: null,
        description: 'URL da logo do cabeçalho da Futepédia'
      });
    }

    // Inserir as configurações que não existem
    for (const setting of settingsToInsert) {
      await queryRunner.query(`
        INSERT INTO system_settings (key, value, description) 
        VALUES ('${setting.key}', NULL, '${setting.description}')
      `);
    }

    console.log(`✅ Migration: Configurações de imagens da Futepédia adicionadas (${settingsToInsert.length} inseridas)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover as configurações de imagem da Futepédia
    await queryRunner.query(`
      DELETE FROM system_settings 
      WHERE key IN ('futepedia_og_image_url', 'futepedia_header_logo_url')
    `);

    console.log('✅ Migration: Configurações de imagens da Futepédia removidas');
  }
} 