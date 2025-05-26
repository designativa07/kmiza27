const { Pool } = require('pg');

async function importNewData() {
  console.log('🔄 Iniciando importação de dados novos...');
  
  // Configuração do banco
  const pool = new Pool({
    host: '195.200.0.191',
    port: 5433,
    database: 'kmiza27',
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  });
  
  try {
    const client = await pool.connect();
    console.log('🔗 Conectado ao PostgreSQL');
    
    // Verificar dados existentes
    const existingTeams = await client.query('SELECT COUNT(*) FROM teams');
    const existingCompetitions = await client.query('SELECT COUNT(*) FROM competitions');
    const existingMatches = await client.query('SELECT COUNT(*) FROM matches');
    
    console.log(`📊 Dados existentes:`);
    console.log(`🏆 Times: ${existingTeams.rows[0].count}`);
    console.log(`🏆 Competições: ${existingCompetitions.rows[0].count}`);
    console.log(`⚽ Jogos: ${existingMatches.rows[0].count}`);
    
    // Times para adicionar (apenas os que não existem)
    const newTeams = [
      { name: 'Cuiabá', slug: 'cuiaba', short: 'Cuiabá', logo: 'cuiaba.svg', country: 'Brasil', stadium: 'Arena Pantanal', city: 'Cuiabá', state: 'MT', founded: 2001 },
      { name: 'CRB', slug: 'crb', short: 'CRB', logo: 'crb.svg', country: 'Brasil', stadium: 'Rei Pelé', city: 'Maceió', state: 'AL', founded: 1912 },
      { name: 'Coritiba', slug: 'coritiba', short: 'Coritiba', logo: 'coritiba.svg', country: 'Brasil', stadium: 'Couto Pereira', city: 'Curitiba', state: 'PR', founded: 1909 },
      { name: 'Goiás', slug: 'goias', short: 'Goiás', logo: 'goias.svg', country: 'Brasil', stadium: 'Serrinha', city: 'Goiânia', state: 'GO', founded: 1943 },
      { name: 'Athlético-PR', slug: 'athletico-pr', short: 'Athlético-PR', logo: 'athletico-pr.svg', country: 'Brasil', stadium: 'Ligga Arena', city: 'Curitiba', state: 'PR', founded: 1924 },
      { name: 'Atlético-GO', slug: 'atletico-go', short: 'Atlético-GO', logo: 'atletico-go.svg', country: 'Brasil', stadium: 'Antônio Accioly', city: 'Goiânia', state: 'GO', founded: 1937 },
      { name: 'Remo', slug: 'remo', short: 'Remo', logo: 'remo.svg', country: 'Brasil', stadium: 'Mangueirão', city: 'Belém', state: 'PA', founded: 1905 },
      { name: 'Novorizontino', slug: 'novorizontino', short: 'Novorizontino', logo: 'novorizontino.svg', country: 'Brasil', stadium: 'Jorge Ismael de Biasi', city: 'Novo Horizonte', state: 'SP', founded: 1973 },
      { name: 'Operário-PR', slug: 'operario-pr', short: 'Operário-PR', logo: 'operario-pr.svg', country: 'Brasil', stadium: 'Germano Krüger', city: 'Ponta Grossa', state: 'PR', founded: 1912 },
      { name: 'Vila Nova', slug: 'vila-nova', short: 'Vila Nova', logo: 'vila-nova.svg', country: 'Brasil', stadium: 'OBA', city: 'Goiânia', state: 'GO', founded: 1943 }
    ];
    
    // Competições para adicionar
    const newCompetitions = [
      { name: 'COPA LIBERTADORES', slug: 'copa-libertadores', season: '2025', type: 'grupos_e_mata_mata', country: '', active: true },
      { name: 'RECOPA SUL-AMERICANA', slug: 'recopa-sul-americana', season: '2025', type: 'mata_mata', country: '', active: true },
      { name: 'COPA INTERCONTINENTAL', slug: 'copa-intercontinental', season: '2025', type: 'mata_mata', country: '', active: true }
    ];
    
    let teamsAdded = 0;
    let competitionsAdded = 0;
    
    // Adicionar times novos
    console.log('\\n🏆 Adicionando times novos...');
    for (const team of newTeams) {
      try {
        // Verificar se já existe
        const existing = await client.query('SELECT id FROM teams WHERE slug = $1', [team.slug]);
        
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO teams (name, slug, full_name, short_name, city, state, country, founded_year, logo_url, stadium, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          `, [team.name, team.slug, team.name, team.short, team.city, team.state, team.country, team.founded, team.logo, team.stadium]);
          
          console.log(`✅ Time adicionado: ${team.name} (${team.city}/${team.state})`);
          teamsAdded++;
        } else {
          console.log(`⚠️  Time já existe: ${team.name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao adicionar time ${team.name}:`, error.message);
      }
    }
    
    // Adicionar competições novas
    console.log('\\n🏆 Adicionando competições novas...');
    for (const comp of newCompetitions) {
      try {
        // Verificar se já existe
        const existing = await client.query('SELECT id FROM competitions WHERE slug = $1', [comp.slug]);
        
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO competitions (name, slug, season, type, country, is_active, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `, [comp.name, comp.slug, comp.season, comp.type, comp.country, comp.active]);
          
          console.log(`✅ Competição adicionada: ${comp.name}`);
          competitionsAdded++;
        } else {
          console.log(`⚠️  Competição já existe: ${comp.name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao adicionar competição ${comp.name}:`, error.message);
      }
    }
    
    // Adicionar alguns jogos de exemplo
    console.log('\\n⚽ Adicionando jogos de exemplo...');
    const sampleMatches = [
      { competition_id: 1, home_team_id: 1, away_team_id: 2, match_date: '2025-03-15 16:00:00', status: 'scheduled' },
      { competition_id: 1, home_team_id: 3, away_team_id: 4, match_date: '2025-03-15 18:30:00', status: 'scheduled' },
      { competition_id: 1, home_team_id: 5, away_team_id: 6, match_date: '2025-03-16 16:00:00', status: 'scheduled' },
      { competition_id: 1, home_team_id: 7, away_team_id: 8, match_date: '2025-03-16 18:30:00', status: 'scheduled' },
      { competition_id: 1, home_team_id: 9, away_team_id: 10, match_date: '2025-03-17 16:00:00', status: 'scheduled' }
    ];
    
    let matchesAdded = 0;
    for (const match of sampleMatches) {
      try {
        await client.query(`
          INSERT INTO matches (competition_id, home_team_id, away_team_id, match_date, status, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [match.competition_id, match.home_team_id, match.away_team_id, match.match_date, match.status]);
        
        matchesAdded++;
      } catch (error) {
        console.error(`❌ Erro ao adicionar jogo:`, error.message);
      }
    }
    
    console.log(`✅ Jogos adicionados: ${matchesAdded}`);
    
    // Verificar dados finais
    const finalTeams = await client.query('SELECT COUNT(*) FROM teams');
    const finalCompetitions = await client.query('SELECT COUNT(*) FROM competitions');
    const finalMatches = await client.query('SELECT COUNT(*) FROM matches');
    
    console.log(`\\n📊 Dados após importação:`);
    console.log(`🏆 Times: ${finalTeams.rows[0].count} (+${teamsAdded})`);
    console.log(`🏆 Competições: ${finalCompetitions.rows[0].count} (+${competitionsAdded})`);
    console.log(`⚽ Jogos: ${finalMatches.rows[0].count} (+${matchesAdded})`);
    
    // Listar alguns times recentes
    const recentTeams = await client.query('SELECT name, city, state FROM teams ORDER BY created_at DESC LIMIT 10');
    console.log(`\\n🏆 Times mais recentes:`);
    recentTeams.rows.forEach(team => {
      console.log(`   • ${team.name} (${team.city}/${team.state})`);
    });
    
    client.release();
    console.log('\\n🎉 Importação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  importNewData()
    .then(() => {
      console.log('\\n✅ Script finalizado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { importNewData }; 