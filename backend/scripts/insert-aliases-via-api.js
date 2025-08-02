const axios = require('axios');

async function insertAliasesViaAPI() {
  try {
    console.log('🔍 Inserindo aliases via API...\n');

    // Primeiro, buscar todos os times
    const teamsResponse = await axios.get('http://localhost:3000/teams?limit=1000');
    const teams = teamsResponse.data.data;
    
    console.log(`📊 Encontrados ${teams.length} times\n`);

    // Definir os aliases para os times principais
    const aliasesToInsert = [
      {
        name: 'Botafogo',
        aliases: ['fogão', 'fogao', 'estrela', 'solitária', 'solitaria']
      },
      {
        name: 'Flamengo',
        aliases: ['mengão', 'mengao', 'fla']
      },
      {
        name: 'Vasco',
        aliases: ['vascão', 'vascao']
      },
      {
        name: 'Palmeiras',
        aliases: ['verdão', 'verdao']
      },
      {
        name: 'Corinthians',
        aliases: ['timão', 'timao']
      },
      {
        name: 'São Paulo',
        aliases: ['são paulo', 'sao paulo', 'spfc']
      },
      {
        name: 'Santos',
        aliases: ['peixe']
      }
    ];

    // Inserir aliases para cada time
    for (const aliasData of aliasesToInsert) {
      const team = teams.find(t => t.name === aliasData.name);
      
      if (team) {
        try {
          console.log(`📝 Inserindo aliases para ${team.name}...`);
          
          const response = await axios.patch(`http://localhost:3000/teams/${team.id}/aliases`, {
            aliases: aliasData.aliases
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log(`✅ Aliases inseridos para ${team.name}: ${JSON.stringify(aliasData.aliases)}`);
        } catch (error) {
          console.log(`❌ Erro ao inserir aliases para ${team.name}: ${error.response?.data?.message || error.message}`);
        }
      } else {
        console.log(`⚠️ Time "${aliasData.name}" não encontrado`);
      }
    }

    // Verificar os resultados
    console.log('\n📊 Verificando aliases inseridos...');
    
    for (const aliasData of aliasesToInsert) {
      const team = teams.find(t => t.name === aliasData.name);
      
      if (team) {
        try {
          const teamResponse = await axios.get(`http://localhost:3000/teams/${team.id}`);
          const updatedTeam = teamResponse.data;
          
          if (updatedTeam.aliases && updatedTeam.aliases.length > 0) {
            console.log(`✅ ${updatedTeam.name}: ${JSON.stringify(updatedTeam.aliases)}`);
          } else {
            console.log(`⚠️ ${updatedTeam.name}: Sem aliases`);
          }
        } catch (error) {
          console.log(`❌ Erro ao verificar ${aliasData.name}: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

insertAliasesViaAPI(); 