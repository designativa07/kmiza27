const axios = require('axios');

async function testInterval() {
  try {
    console.log('🧪 Testando criação de notificação com intervalo personalizado...');
    
    const notificationData = {
      type: 'custom',
      title: 'Teste Intervalo',
      message: 'Testando o novo campo de intervalo entre envios - 2 segundos',
      send_interval_ms: 2000
    };

    console.log('📤 Enviando dados:', notificationData);

    const response = await axios.post('http://localhost:3000/notifications', notificationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Notificação criada com sucesso!');
    console.log('📋 Resposta:', response.data);

    // Verificar se o campo foi salvo corretamente
    const getResponse = await axios.get(`http://localhost:3000/notifications/${response.data.id}`);
    console.log('🔍 Verificando notificação criada:');
    console.log('📊 Dados salvos:', {
      id: getResponse.data.id,
      title: getResponse.data.title,
      send_interval_ms: getResponse.data.send_interval_ms
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testInterval(); 