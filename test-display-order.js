// Script para testar o campo display_order
const API_URL = 'http://localhost:3000'; // Ajuste conforme necessário

async function testDisplayOrder() {
  try {
    console.log('🧪 Testando campo display_order...');
    
    // 1. Buscar competições
    console.log('\n1. Buscando competições...');
    const competitionsRes = await fetch(`${API_URL}/competitions`);
    const competitions = await competitionsRes.json();
    
    console.log(`✅ Encontradas ${competitions.length} competições`);
    
    // Verificar se display_order está presente
    const hasDisplayOrder = competitions.every(comp => 'display_order' in comp);
    console.log(`✅ Campo display_order presente: ${hasDisplayOrder}`);
    
    // Mostrar algumas competições com display_order
    console.log('\n📋 Exemplos de competições:');
    competitions.slice(0, 3).forEach(comp => {
      console.log(`  - ${comp.name} (ID: ${comp.id}, Ordem: ${comp.display_order})`);
    });
    
    // 2. Testar atualização de display_order
    if (competitions.length > 0) {
      const firstComp = competitions[0];
      console.log(`\n2. Testando atualização de display_order para "${firstComp.name}"...`);
      
      const newOrder = firstComp.display_order + 10;
      const updateRes = await fetch(`${API_URL}/competitions/${firstComp.id}/display-order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newOrder })
      });
      
      if (updateRes.ok) {
        console.log(`✅ Display order atualizado para ${newOrder}`);
      } else {
        console.log(`❌ Erro ao atualizar display order: ${updateRes.statusText}`);
      }
    }
    
    // 3. Testar atualização em lote
    console.log('\n3. Testando atualização em lote...');
    const batchUpdates = competitions.slice(0, 2).map((comp, index) => ({
      id: comp.id,
      display_order: comp.display_order + 100 + index
    }));
    
    const batchRes = await fetch(`${API_URL}/competitions/display-orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchUpdates)
    });
    
    if (batchRes.ok) {
      console.log(`✅ Atualização em lote realizada`);
    } else {
      console.log(`❌ Erro na atualização em lote: ${batchRes.statusText}`);
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testDisplayOrder();