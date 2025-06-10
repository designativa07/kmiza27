const fetch = require('node-fetch');

async function debugTeamVariations() {
  try {
    console.log('🔍 Debugando variações de nomes de times...');
    
    // Buscar todos os times
    const teamsResponse = await fetch('https://kmizabot.h4xd66.easypanel.host/teams');
    const teams = await teamsResponse.json();
    
    console.log('📊 Total de times:', teams.length);
    
    // Simular a lógica do loadTeamNames()
    const teamNames = [];
    
    teams.forEach(team => {
      if (team.name) teamNames.push(team.name.toLowerCase());
      if (team.short_name) teamNames.push(team.short_name.toLowerCase());
      if (team.slug) teamNames.push(team.slug.toLowerCase());
    });
    
    // Remover duplicatas
    const uniqueTeamNames = [...new Set(teamNames)];
    
    console.log('📊 Total de variações de nomes:', uniqueTeamNames.length);
    
    // Procurar variações que contêm "henrique"
    const henriqueVariations = uniqueTeamNames.filter(name => 
      name.includes('henrique')
    );
    
    console.log('\n🔍 Variações que contêm "henrique":');
    henriqueVariations.forEach(name => {
      console.log(`  - "${name}"`);
    });
    
    // Procurar variações que contêm "bruno"
    const brunoVariations = uniqueTeamNames.filter(name => 
      name.includes('bruno')
    );
    
    console.log('\n🔍 Variações que contêm "bruno":');
    brunoVariations.forEach(name => {
      console.log(`  - "${name}"`);
    });
    
    // Procurar específicamente por "deportes iquique" e "fortaleza"
    const deportesVariations = uniqueTeamNames.filter(name => 
      name.includes('deportes') || name.includes('iquique')
    );
    
    console.log('\n🔍 Variações com "deportes" ou "iquique":');
    deportesVariations.forEach(name => {
      console.log(`  - "${name}"`);
    });
    
    const fortalezaVariations = uniqueTeamNames.filter(name => 
      name.includes('fortaleza')
    );
    
    console.log('\n🔍 Variações com "fortaleza":');
    fortalezaVariations.forEach(name => {
      console.log(`  - "${name}"`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugTeamVariations(); 