const axios = require('axios');

async function testAcademyEndpoint() {
  try {
    console.log('🧪 Testando endpoint da academia...\n');

    // 1. Testar endpoint de teste
    console.log('🔍 Testando endpoint /test...');
    try {
      const testResponse = await axios.get('http://localhost:3004/api/v2/academy/test');
      console.log('✅ Endpoint /test funcionando:', testResponse.data);
    } catch (error) {
      console.log('❌ Endpoint /test falhou:', error.message);
    }

    // 2. Testar endpoint overview sem teamId
    console.log('\n🔍 Testando endpoint /overview sem teamId...');
    try {
      const overviewResponse = await axios.get('http://localhost:3004/api/v2/academy/overview');
      console.log('✅ Endpoint /overview funcionando:', overviewResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Endpoint /overview retornou erro esperado (sem teamId):', error.response.data);
      } else {
        console.log('❌ Endpoint /overview falhou:', error.message);
      }
    }

    // 3. Testar endpoint overview com teamId inválido
    console.log('\n🔍 Testando endpoint /overview com teamId inválido...');
    try {
      const overviewResponse = await axios.get('http://localhost:3004/api/v2/academy/overview?teamId=invalid-uuid');
      console.log('✅ Endpoint /overview funcionando:', overviewResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Endpoint /overview retornou erro esperado (UUID inválido):', error.response.data);
      } else {
        console.log('❌ Endpoint /overview falhou:', error.message);
      }
    }

    // 4. Testar endpoint overview com teamId válido (se houver)
    console.log('\n🔍 Testando endpoint /overview com teamId válido...');
    try {
      // UUID válido de exemplo
      const validTeamId = '26a70149-b8f0-4e44-a096-7243a8e26d08';
      const overviewResponse = await axios.get(`http://localhost:3004/api/v2/academy/overview?teamId=${validTeamId}`);
      console.log('✅ Endpoint /overview funcionando com teamId válido:', overviewResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Endpoint /overview retornou erro:', error.response.data);
        console.log('   Status:', error.response.status);
      } else {
        console.log('❌ Endpoint /overview falhou:', error.message);
      }
    }

    console.log('\n🎉 Teste dos endpoints concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    process.exit(0);
  }
}

// Executar teste
testAcademyEndpoint().catch(console.error);
