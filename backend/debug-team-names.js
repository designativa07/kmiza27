const fetch = require('node-fetch');

async function debugTeamNames() {
  try {
    console.log('🔍 Debugando nomes de times...');
    
    // Buscar todos os times
    const teamsResponse = await fetch('https://kmizabot.h4xd66.easypanel.host/teams');
    const teams = await teamsResponse.json();
    
    console.log('📊 Total de times:', teams.length);
    
    // Procurar times que contêm "henrique"
    const henriqueTeams = teams.filter(team => 
      team.name.toLowerCase().includes('henrique') ||
      team.short_name?.toLowerCase().includes('henrique') ||
      team.full_name?.toLowerCase().includes('henrique')
    );
    
    console.log('\n🔍 Times que contêm "henrique":');
    henriqueTeams.forEach(team => {
      console.log(`  - ID: ${team.id}, Nome: "${team.name}", Short: "${team.short_name}", Full: "${team.full_name}"`);
    });
    
    // Procurar times que contêm "bruno"
    const brunoTeams = teams.filter(team => 
      team.name.toLowerCase().includes('bruno') ||
      team.short_name?.toLowerCase().includes('bruno') ||
      team.full_name?.toLowerCase().includes('bruno')
    );
    
    console.log('\n🔍 Times que contêm "bruno":');
    brunoTeams.forEach(team => {
      console.log(`  - ID: ${team.id}, Nome: "${team.name}", Short: "${team.short_name}", Full: "${team.full_name}"`);
    });
    
    // Procurar Deportes Iquique e Fortaleza
    const suspectTeams = teams.filter(team => 
      team.name.toLowerCase().includes('deportes iquique') ||
      team.name.toLowerCase().includes('fortaleza')
    );
    
    console.log('\n🔍 Times suspeitos (Deportes Iquique e Fortaleza):');
    suspectTeams.forEach(team => {
      console.log(`  - ID: ${team.id}, Nome: "${team.name}", Short: "${team.short_name}", Full: "${team.full_name}"`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugTeamNames(); 