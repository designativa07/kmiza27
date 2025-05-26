const axios = require('axios');

async function testSendWithInterval() {
  try {
    console.log('🧪 Testando envio com intervalo personalizado...');
    
    // Usar a notificação que acabamos de criar (ID 22)
    const notificationId = 22;
    
    console.log(`📤 Iniciando envio da notificação ${notificationId}...`);
    console.log('⏱️  Intervalo configurado: 2000ms (2 segundos)');
    
    const startTime = Date.now();
    
    const response = await axios.post(`http://localhost:3000/notifications/${notificationId}/send`);
    
    console.log('✅ Envio iniciado com sucesso!');
    console.log('📋 Resposta:', response.data);
    
    // Monitorar o progresso por alguns segundos
    console.log('📊 Monitorando progresso...');
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 3 segundos
      
      try {
        const progressResponse = await axios.get(`http://localhost:3000/notifications/${notificationId}/progress`);
        const progress = progressResponse.data;
        
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`⏰ ${elapsed}s - Progresso: ${progress.progress_percentage}% | Enviados: ${progress.sent_count}/${progress.total_recipients} | Status: ${progress.send_status}`);
        
        if (progress.send_status === 'completed' || progress.send_status === 'failed') {
          console.log('🏁 Envio finalizado!');
          break;
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar progresso: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testSendWithInterval(); 