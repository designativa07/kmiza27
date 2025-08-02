const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugTeamDetection() {
  try {
    console.log('🔍 Debugando detecção de times...\n');

    // 1. Buscar todos os times que contêm "botafogo"
    console.log('📋 Buscando times com "botafogo" no nome...');
    const teamsResponse = await axios.get(`${BASE_URL}/teams?search=botafogo&limit=100`);
    const teams = teamsResponse.data.data || teamsResponse.data;
    
    console.log(`✅ Encontrados ${teams.length} times:`);
    teams.forEach(team => {
      console.log(`  - ID: ${team.id}`);
      console.log(`    Nome: ${team.name}`);
      console.log(`    Nome completo: ${team.full_name || 'N/A'}`);
      console.log(`    Sigla: ${team.short_name || 'N/A'}`);
      console.log(`    Slug: ${team.slug || 'N/A'}`);
      console.log(`    Cidade: ${team.city || 'N/A'}`);
      console.log(`    Estado: ${team.state || 'N/A'}`);
      console.log('');
    });

    // 2. Testar detecção com diferentes inputs
    console.log('🧪 Testando detecção de times...\n');
    
    const testMessages = [
      'botafogo',
      'Botafogo',
      'BOTAFOGO',
      'botafogo-rj',
      'Botafogo-RJ',
      'botafogo-sp',
      'Botafogo-SP',
      'botafogo-pb',
      'Botafogo-PB',
      'bota',
      'fogão',
      'estrela solitária'
    ];

    for (const message of testMessages) {
      try {
        console.log(`📝 Testando: "${message}"`);
        
        // Simular análise de mensagem
        const analysisResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
          message: message,
          phoneNumber: '5511999999999'
        });
        
        console.log(`✅ Resposta: ${analysisResponse.data.response || analysisResponse.data}`);
        console.log('');
      } catch (error) {
        console.log(`❌ Erro: ${error.response?.data?.message || error.message}`);
        console.log('');
      }
    }

    // 3. Verificar configuração do chatbot
    console.log('🤖 Verificando configuração do chatbot...\n');
    
    try {
      const configResponse = await axios.get(`${BASE_URL}/bot-config`);
      const configs = configResponse.data;
      
      const teamDetectionConfig = configs.find(c => c.key === 'team_detection_config');
      if (teamDetectionConfig) {
        console.log(`✅ Configuração de detecção de times: ${teamDetectionConfig.value}`);
      } else {
        console.log('⚠️ Nenhuma configuração específica de detecção de times encontrada');
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar configurações: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('📡 Resposta do servidor:', error.response.data);
    }
  }
}

debugTeamDetection(); 