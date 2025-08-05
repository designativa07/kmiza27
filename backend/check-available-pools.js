const { Client } = require('pg')

async function checkAvailablePools() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'kmiza27_dev',
    user: 'admin',
    password: 'password'
  })

  try {
    await client.connect()
    console.log('Conectado ao banco de dados')
    
    const pools = await client.query(`
      SELECT id, name, status, type, round_id, created_by_user_id
      FROM pools 
      ORDER BY id DESC
      LIMIT 10
    `)
    
    console.log('\n🏆 Bolões disponíveis:')
    pools.rows.forEach((pool, index) => {
      console.log(`${index + 1}. ID: ${pool.id} - ${pool.name} (${pool.status})`)
    })
    
    // Verificar matches disponíveis
    const matches = await client.query(`
      SELECT pm.pool_id, pm.match_id, m.home_team_id, m.away_team_id, m.status, ht.name as home_team, at.name as away_team
      FROM pool_matches pm
      JOIN matches m ON pm.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE pm.pool_id IN (${pools.rows.map(p => p.id).join(',')})
      ORDER BY pm.pool_id, pm.order_index
      LIMIT 20
    `)
    
    console.log('\n⚽ Matches disponíveis:')
    matches.rows.forEach((match, index) => {
      console.log(`${index + 1}. Pool ${match.pool_id} - Match ${match.match_id}: ${match.home_team} vs ${match.away_team} (${match.status})`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await client.end()
  }
}

checkAvailablePools() 