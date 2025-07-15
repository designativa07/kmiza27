/**
 * Script de teste para demonstrar a integração do Shlink
 * Execute com: node test-shlink-integration.js
 */

const API_KEY = '87b73696-cfb3-416f-9d4d-238b367a7d52';
const SHLINK_URL = 'https://kmiza27-shlink.h4xd66.easypanel.host';
const SHLINK_DOMAIN = 'https://link.kmiza27.com'; // Domínio personalizado
const BACKEND_URL = 'https://seu-backend.com'; // Substitua pela URL do seu backend

console.log('🧪 TESTE DE INTEGRAÇÃO SHLINK + CHATBOT');
console.log('=====================================\n');

// Teste 1: Testar API diretamente
async function testShlinkAPI() {
  console.log('1️⃣ Testando API do Shlink diretamente...');
  
  try {
    // Listar URLs existentes
    const response = await fetch(`${SHLINK_URL}/rest/v3/short-urls`, {
      headers: {
        'X-Api-Key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API do Shlink funcionando');
      console.log(`📊 URLs existentes: ${data.shortUrls?.data?.length || 0}`);
    } else {
      console.log('❌ API do Shlink não respondeu:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com Shlink:', error.message);
  }
  
  console.log('');
}

// Teste 2: Criar URL curta via API
async function testCreateShortUrl() {
  console.log('2️⃣ Criando URL curta de teste...');
  
  try {
    const response = await fetch(`${SHLINK_URL}/rest/v3/short-urls`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        longUrl: 'https://kmiza27.com/brasileirao/classificacao',
        customSlug: `teste-${Date.now()}`,
        title: '🏆 Brasileirão - Classificação',
        tags: ['teste', 'brasileirao', 'kmiza27-bot']
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ URL curta criada com sucesso!');
      console.log(`🔗 URL curta: ${data.shortUrl.shortUrl}`);
      console.log(`📝 Título: ${data.shortUrl.title}`);
      console.log(`🏷️ Tags: ${data.shortUrl.tags?.join(', ')}`);
    } else {
      const error = await response.text();
      console.log('❌ Erro ao criar URL curta:', error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
  
  console.log('');
}

// Teste 3: Testar backend integrado (se disponível)
async function testBackendIntegration() {
  console.log('3️⃣ Testando integração no backend...');
  
  try {
    // Health check do serviço
    const healthResponse = await fetch(`${BACKEND_URL}/url-shortener/health`);
    
    if (healthResponse.ok) {
      console.log('✅ Backend integrado funcionando');
      
      // Testar criação de URL para jogo
      const matchResponse = await fetch(`${BACKEND_URL}/url-shortener/match/123`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          homeTeam: 'Flamengo',
          awayTeam: 'Palmeiras'
        })
      });
      
      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        console.log('🎯 URL para jogo criada:');
        console.log(`🔗 ${matchData.shortUrl}`);
      }
    } else {
      console.log('⚠️ Backend não está disponível ou não configurado');
    }
  } catch (error) {
    console.log('⚠️ Backend não acessível:', error.message);
  }
  
  console.log('');
}

// Teste 4: Simular resposta do chatbot
async function simulateChatbotResponse() {
  console.log('4️⃣ Simulando resposta do chatbot...');
  
  const mockMatch = {
    id: 123,
    home_team: { name: 'Flamengo' },
    away_team: { name: 'Palmeiras' },
    match_date: new Date(),
    competition: { name: 'Brasileirão' },
    stadium: { name: 'Maracanã' }
  };
  
  // Simular criação de URL curta
  try {
    const shortUrl = `${SHLINK_DOMAIN}/j-123`;
    
    const chatbotResponse = `🔴 PRÓXIMO JOGO DO FLAMENGO
⚽ *Flamengo x Palmeiras*
📅 Data: ${mockMatch.match_date.toLocaleDateString('pt-BR')}
⏰ Hora: 16:00

🏆 Competição: ${mockMatch.competition.name}
🏟️ Estádio: ${mockMatch.stadium.name}

📺 Transmissão: Globo, SporTV

🔗 Mais detalhes: ${shortUrl}

Bora torcer! 🔥⚽`;
    
    console.log('✅ Resposta do chatbot simulada:');
    console.log('---');
    console.log(chatbotResponse);
    console.log('---');
    
    console.log('🎯 Observe que a URL curta foi automaticamente incluída!');
    
  } catch (error) {
    console.log('❌ Erro na simulação:', error.message);
  }
  
  console.log('');
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes...\n');
  
  await testShlinkAPI();
  await testCreateShortUrl();
  await testBackendIntegration();
  await simulateChatbotResponse();
  
  console.log('🎉 Testes concluídos!');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Configure as variáveis de ambiente no backend');
  console.log('2. Teste a integração com o chatbot real');
  console.log('3. Configure domínio personalizado (opcional)');
  console.log('4. Monitore as estatísticas de cliques');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testShlinkAPI,
  testCreateShortUrl,
  testBackendIntegration,
  simulateChatbotResponse
}; 