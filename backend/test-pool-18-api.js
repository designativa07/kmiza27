const axios = require('axios');

async function testPool18API() {
  try {
    console.log('🔍 Testando API do bolão 18...');

    // Testar endpoint público do bolão
    const publicResponse = await axios.get('http://localhost:3000/pools/18/public');
    console.log('✅ Resposta pública:', publicResponse.status);
    console.log('📋 Dados do bolão:', {
      id: publicResponse.data.id,
      name: publicResponse.data.name,
      status: publicResponse.data.status,
      participants_count: publicResponse.data.participants?.length || 0
    });

    if (publicResponse.data.participants) {
      console.log('👥 Participantes:');
      publicResponse.data.participants.forEach((p, index) => {
        console.log(`  ${index + 1}. User ID: ${p.user_id || p.user?.id}, Name: ${p.user?.name || 'N/A'}`);
      });
    }

    // Testar endpoint privado (com autenticação)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFudG9uaW8ubWVkZWlyb3NAZ21haWwuY29tIiwic3ViIjoxOSwiaXNfYWRtaW4iOnRydWUsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDQzMDg0OCwiZXhwIjoxNzU0NTE3MjQ4fQ.iQmZwME2_wXqjuS35Io2IBF9IiECLq0_zabpFz21AFE';

    const privateResponse = await axios.get('http://localhost:3000/pools/18', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n🔐 Resposta privada:', privateResponse.status);
    console.log('📋 Dados do bolão (privado):', {
      id: privateResponse.data.id,
      name: privateResponse.data.name,
      status: privateResponse.data.status,
      participants_count: privateResponse.data.participants?.length || 0
    });

    if (privateResponse.data.participants) {
      console.log('👥 Participantes (privado):');
      privateResponse.data.participants.forEach((p, index) => {
        console.log(`  ${index + 1}. User ID: ${p.user_id || p.user?.id}, Name: ${p.user?.name || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testPool18API(); 