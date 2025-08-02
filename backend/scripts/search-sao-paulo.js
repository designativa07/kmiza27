const axios = require('axios');

async function searchSaoPaulo() {
  try {
    console.log('🔍 Buscando times com "são" ou "paulo"...\n');
    
    const searches = [
      'são',
      'sao',
      'paulo',
      'são paulo',
      'sao paulo'
    ];
    
    for (const search of searches) {
      try {
        console.log(`📝 Buscando: "${search}"`);
        
        const response = await axios.get(`http://localhost:3000/teams?search=${encodeURIComponent(search)}&limit=10`);
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Encontrados: ${response.data.data.length} times`);
        
        if (response.data.data.length > 0) {
          response.data.data.forEach((team, index) => {
            console.log(`  ${index + 1}. ${team.name} (${team.city || 'N/A'}-${team.state || 'N/A'})`);
          });
        }
        console.log('');
      } catch (error) {
        console.log(`❌ Erro: ${error.response?.status || error.message}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

searchSaoPaulo(); 