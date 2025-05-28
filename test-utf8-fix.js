const https = require('https');

console.log('🧪 TESTANDO CORREÇÃO UTF-8 - Chatbot com Acentos');
console.log('='.repeat(60));

const testesUTF8 = [
  {
    nome: 'Teste 1: Saudação Básica',
    payload: { phoneNumber: '5511999999999', message: 'Oi' },
    esperado: 'Funcionar normalmente'
  },
  {
    nome: 'Teste 2: Pergunta com Acento (Próximo)',  
    payload: { phoneNumber: '5511999999999', message: 'Próximo jogo do Flamengo' },
    esperado: 'Processar corretamente os acentos'
  },
  {
    nome: 'Teste 3: Múltiplos Acentos',
    payload: { phoneNumber: '5511999999999', message: 'Classificação do Brasileirão' },
    esperado: 'Processar ç, ã, ã corretamente'
  },
  {
    nome: 'Teste 4: Cedilha e Til',
    payload: { phoneNumber: '5511999999999', message: 'Posição do São Paulo' },
    esperado: 'Processar ç, ã corretamente'
  },
  {
    nome: 'Teste 5: Emojis e Acentos',
    payload: { phoneNumber: '5511999999999', message: '⚽ Próximos jogos?' },
    esperado: 'Processar emojis e acentos juntos'
  }
];

async function testarUTF8() {
  console.log(`🚀 Iniciando ${testesUTF8.length} testes UTF-8...\\n`);
  
  for (let i = 0; i < testesUTF8.length; i++) {
    const teste = testesUTF8[i];
    
    console.log(`${i + 1}. ${teste.nome}`);
    console.log(`👤 Mensagem: "${teste.payload.message}"`);
    console.log(`🎯 Esperado: ${teste.esperado}`);
    
    try {
      const resultado = await enviarTeste(teste.payload);
      
      if (resultado.success) {
        console.log(`✅ SUCESSO: Teste passou!`);
        console.log(`🤖 Resposta: ${resultado.response?.substring(0, 100)}...`);
        
        if (resultado.response && resultado.response.length > 10) {
          console.log(`🎉 UTF-8 FUNCIONOU: Acentos processados corretamente!`);
        }
        
      } else if (resultado.error) {
        console.log(`❌ ERRO: ${resultado.error}`);
        if (resultado.error.includes('JSON')) {
          console.log(`🚨 PROBLEMA UTF-8 AINDA EXISTE!`);
        }
      } else {
        console.log(`⚠️ Resposta inesperada:`, resultado);
      }
      
    } catch (error) {
      console.log(`❌ FALHA: ${error.message}`);
    }
    
    console.log('-'.repeat(50));
    
    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\\n🏁 TESTE UTF-8 CONCLUÍDO!');
  console.log('📊 Verifique os resultados acima para confirmar se a correção funcionou.');
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
        'Content-Type': 'application/json; charset=utf-8', // ✅ Forçar UTF-8
        'Content-Length': Buffer.byteLength(data, 'utf8')   // ✅ Calcular corretamente
      }
    };

    const req = https.request(options, (res) => {
      res.setEncoding('utf8'); // ✅ Garantir UTF-8 na resposta
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

    req.write(data, 'utf8'); // ✅ Forçar UTF-8 no envio
    req.end();
  });
}

// Aguardar 30 segundos para o deploy terminar e executar
console.log('⏳ Aguardando 30 segundos para o deploy em produção...');
setTimeout(testarUTF8, 30000); 