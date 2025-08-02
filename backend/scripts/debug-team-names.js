const axios = require('axios');

async function debugTeamNames() {
  try {
    console.log('🔍 Debugando nomes dos times...\n');
    
    // Buscar todos os times
    const response = await axios.get('http://localhost:3000/teams/all');
    const teams = response.data;
    
    console.log(`📊 Total de times: ${teams.length}\n`);
    
    // Procurar por times que contêm "sao" ou "paulo"
    const saoPauloTeams = teams.filter(team => 
      team.name.toLowerCase().includes('sao') || 
      team.name.toLowerCase().includes('paulo') ||
      team.short_name?.toLowerCase().includes('sao') ||
      team.short_name?.toLowerCase().includes('paulo')
    );
    
    console.log('🔍 Times relacionados a São Paulo:');
    saoPauloTeams.forEach((team, index) => {
      console.log(`  ${index + 1}. Nome: "${team.name}"`);
      console.log(`     Sigla: "${team.short_name || 'N/A'}"`);
      console.log(`     Slug: "${team.slug || 'N/A'}"`);
      console.log(`     Cidade: "${team.city || 'N/A'}"`);
      console.log(`     Estado: "${team.state || 'N/A'}"`);
      console.log('');
    });
    
    // Simular como o sistema processa os nomes
    console.log('🔧 Simulando processamento dos nomes:');
    saoPauloTeams.forEach((team, index) => {
      const processedName = team.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      console.log(`  ${index + 1}. Original: "${team.name}"`);
      console.log(`     Processado: "${processedName}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugTeamNames(); 