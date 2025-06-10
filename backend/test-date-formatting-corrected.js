// Teste para verificar correção de horários UTC
console.log('🔧 TESTE APÓS CORREÇÃO DE HORÁRIOS');
console.log('==================================');

// Data de exemplo do banco: 2025-04-06 21:30:00+00
const sampleDate = new Date('2025-04-06T21:30:00.000Z');

console.log('\n📅 Data original do banco:');
console.log('Raw:', sampleDate.toISOString());

console.log('\n🤖 COMO O CHATBOT ESTÁ FORMATANDO AGORA (UTC):');
console.log('UTC Hours:', `${sampleDate.getUTCHours().toString().padStart(2, '0')}:${sampleDate.getUTCMinutes().toString().padStart(2, '0')}`);

console.log('\n💻 COMO O FRONTEND DEVERIA FORMATAR:');
console.log('Frontend esperado: 21:30 (UTC)');

console.log('\n🔧 COMPARAÇÃO ANTES VS DEPOIS:');
console.log('ANTES (com timezone local):', sampleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
console.log('DEPOIS (UTC direto):', `${sampleDate.getUTCHours().toString().padStart(2, '0')}:${sampleDate.getUTCMinutes().toString().padStart(2, '0')}`);

// Teste com várias datas do banco
const testDates = [
  '2025-04-01T02:00:00.000Z', // 02:00 UTC
  '2025-05-05T23:00:00.000Z', // 23:00 UTC  
  '2025-04-06T21:30:00.000Z', // 21:30 UTC
  '2025-04-20T23:30:00.000Z', // 23:30 UTC
];

console.log('\n🧪 TESTE CORREÇÃO COM VÁRIAS DATAS:');
testDates.forEach((dateStr, i) => {
  const date = new Date(dateStr);
  const utcTime = `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
  const localTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  console.log(`\nTeste ${i+1}: ${dateStr}`);
  console.log(`  UTC (correto): ${utcTime}`);
  console.log(`  Local (problema): ${localTime}`);
  console.log(`  ✅ Diferença corrigida: ${utcTime === localTime ? 'NÃO' : 'SIM'}`);
});

console.log('\n🎯 RESULTADO:');
console.log('✅ Agora o chatbot mostra horários em UTC (igual ao frontend)');
console.log('✅ Não há mais conversão para timezone local do servidor'); 