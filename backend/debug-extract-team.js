const fetch = require('node-fetch');

async function debugExtractTeam() {
  try {
    console.log('🔍 Debugando extractTeamName...');
    
    // Buscar todos os times para simular o teamNames
    const teamsResponse = await fetch('https://api.kmiza27.com/api/teams');
    const teams = await teamsResponse.json();
    
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
    
    // Simular extractTeamName para as mensagens problemáticas
    const testMessages = [
      'jogador bruno henrique',
      'jogador Bruno Henrique', 
      'informações do jogador Bruno Henrique',
      'info do Bruno Henrique',
      'dados do Bruno Henrique'
    ];
    
    function extractTeamName(message) {
      for (const team of uniqueTeamNames) {
        if (message.includes(team)) {
          return team;
        }
      }
      return undefined;
    }
    
    testMessages.forEach(message => {
      console.log(`\n🔍 Testando: "${message}"`);
      const lowerMessage = message.toLowerCase();
      console.log(`   Lowercase: "${lowerMessage}"`);
      
      const foundTeam = extractTeamName(lowerMessage);
      if (foundTeam) {
        console.log(`   ❌ Encontrou time: "${foundTeam}"`);
        
        // Descobrir qual time tem esse nome
        const matchingTeam = teams.find(team => 
          team.name?.toLowerCase() === foundTeam ||
          team.short_name?.toLowerCase() === foundTeam ||
          team.slug?.toLowerCase() === foundTeam
        );
        
        if (matchingTeam) {
          console.log(`   📋 Time: ${matchingTeam.name} (ID: ${matchingTeam.id})`);
        }
      } else {
        console.log(`   ✅ Nenhum time encontrado`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugExtractTeam(); 