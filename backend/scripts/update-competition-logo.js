const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function updateCompetitionLogo() {
  try {
    console.log('Atualizando logo da competição...');
    
    // URL válida do CDN
    const validLogoUrl = 'https://cdn.kmiza27.com/img/og-images/og-image-1752700830770';
    
    const result = await pool.query(`
      UPDATE competitions 
      SET logo_url = $1, updated_at = NOW()
      WHERE id = 23 AND category = 'amateur'
    `, [validLogoUrl]);
    
    console.log('Linhas afetadas:', result.rowCount);
    
    // Verificar se foi atualizado
    const checkResult = await pool.query(`
      SELECT id, name, logo_url, updated_at 
      FROM competitions 
      WHERE id = 23
    `);
    
    if (checkResult.rows.length > 0) {
      const competition = checkResult.rows[0];
      console.log('Competição atualizada:', competition);
    }
    
  } catch (error) {
    console.error('Erro ao atualizar logo:', error);
  } finally {
    await pool.end();
  }
}

updateCompetitionLogo(); 