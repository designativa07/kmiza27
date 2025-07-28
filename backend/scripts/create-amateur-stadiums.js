const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'seu_token_aqui';

async function createAmateurStadiums() {
  console.log('=== CRIANDO ESTÁDIOS AMADORES ===');
  
  const stadiums = [
    {
      name: 'Estádio Municipal',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      capacity: 5000,
      address: 'Rua do Futebol, 123',
      description: 'Estádio municipal para jogos amadores'
    },
    {
      name: 'Campo do Bairro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil',
      capacity: 3000,
      address: 'Avenida dos Esportes, 456',
      description: 'Campo de futebol do bairro'
    },
    {
      name: 'Quadra Esportiva',
      city: 'Belo Horizonte',
      state: 'MG',
      country: 'Brasil',
      capacity: 2000,
      address: 'Rua dos Atletas, 789',
      description: 'Quadra esportiva para jogos locais'
    },
    {
      name: 'Complexo Esportivo',
      city: 'Salvador',
      state: 'BA',
      country: 'Brasil',
      capacity: 4000,
      address: 'Avenida da Praia, 321',
      description: 'Complexo esportivo municipal'
    }
  ];

  try {
    for (const stadium of stadiums) {
      console.log(`\nCriando estádio: ${stadium.name}`);
      
      try {
        const response = await axios.post(`${API_URL}/amateur/stadiums`, stadium, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_TOKEN}`
          }
        });
        console.log('✅ Estádio criado:', response.data);
      } catch (error) {
        console.error('❌ Erro ao criar estádio:', error.response?.status, error.response?.data);
      }
    }

    // Verificar estádios criados
    console.log('\n=== VERIFICANDO ESTÁDIOS CRIADOS ===');
    try {
      const response = await axios.get(`${API_URL}/amateur/stadiums`);
      console.log('✅ Estádios encontrados:', response.data.length);
      response.data.forEach(stadium => {
        console.log(`- ${stadium.name} (${stadium.city}, ${stadium.state})`);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estádios:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createAmateurStadiums(); 