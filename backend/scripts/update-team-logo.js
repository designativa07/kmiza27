const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function updateTeamLogo() {
  try {
    console.log('Atualizando logo do time...');
    
    // URL válida do CDN
    const validLogoUrl = 'https://cdn.kmiza27.com/img/futepedia-logos/futepedia-logo-1752700830915';
    
    const result = await pool.query(`
      UPDATE teams 
      SET logo_url = $1, updated_at = NOW()
      WHERE id = 238 AND category = 'amateur'
    `, [validLogoUrl]);
    
    console.log('Linhas afetadas:', result.rowCount);
    
    // Verificar se foi atualizado
    const checkResult = await pool.query(`
      SELECT id, name, logo_url, updated_at 
      FROM teams 
      WHERE id = 238
    `);
    
    if (checkResult.rows.length > 0) {
      const team = checkResult.rows[0];
      console.log('Time atualizado:', team);
    }
    
  } catch (error) {
    console.error('Erro ao atualizar logo:', error);
  } finally {
    await pool.end();
  }
}

updateTeamLogo(); 