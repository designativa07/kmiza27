const https = require('https');

console.log('🔥 TESTANDO RESPOSTA PARA "FLAMENGO" - Simulando Usuário Real');
console.log('='.repeat(60));

// Simular exatamente a mensagem que apareceu nos logs
const payloadReal = {
  phoneNumber: '554896652575',
  message: 'flamengo',
  userName: 'ToniMedeiros'
};

console.log('📱 Simulando mensagem real dos logs:');
console.log(`👤 Usuário: ${payloadReal.userName}`);
console.log(`📞 Telefone: ${payloadReal.phoneNumber}`);
console.log(`💬 Mensagem: "${payloadReal.message}"`);
console.log('');

async function testarFlamengo() {
  try {
    console.log('🚀 Enviando mensagem para o webhook...');
    
    const resultado = await enviarTeste(payloadReal);
    
    if (resultado.success) {
      console.log('✅ SUCESSO: Bot processou a mensagem!');
      console.log('');
      console.log('🤖 RESPOSTA DO BOT:');
      console.log('-'.repeat(50));
      console.log(resultado.response);
      console.log('-'.repeat(50));
      console.log('');
      
      if (resultado.response.includes('Flamengo') || resultado.response.includes('🔥')) {
        console.log('🎯 PERFEITO! Bot entendeu que é sobre o Flamengo!');
      } else {
        console.log('⚠️ Bot respondeu, mas pode não ter detectado o contexto do Flamengo');
      }
      
      console.log('');
      console.log('📊 Dados da resposta:');
      console.log(`📱 Telefone processado: ${resultado.phoneNumber}`);
      console.log(`💬 Mensagem processada: "${resultado.messageText}"`);
      
      if (resultado.pushName) {
        console.log(`👤 Nome do usuário: ${resultado.pushName}`);
      }
      
    } else if (resultado.error) {
      console.log('❌ ERRO:', resultado.error);
      console.log('📄 Detalhes:', resultado.details || 'Sem detalhes');
    } else {
      console.log('⚠️ Resposta inesperada:', JSON.stringify(resultado, null, 2));
    }
    
  } catch (error) {
    console.log('❌ FALHA:', error.message);
  }
}

function enviarTeste(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'kmizabot.h4xd66.easypanel.host',
      port: 443,
      path: '/chatbot/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data, 'utf8')
      }
    };

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (e) {
          resolve({ 
            error: 'JSON Parse Error', 
            details: e.message, 
            raw: responseData,
            status: res.statusCode 
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data, 'utf8');
    req.end();
  });
}

testarFlamengo(); 