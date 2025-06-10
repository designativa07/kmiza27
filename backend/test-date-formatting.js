// Teste para verificar formatação de datas
console.log('🕐 TESTE DE FORMATAÇÃO DE DATAS');
console.log('================================');

// Data de exemplo do banco: 2025-04-06 21:30:00+00
const sampleDate = new Date('2025-04-06T21:30:00.000Z');

console.log('\n📅 Data original do banco:');
console.log('Raw:', sampleDate.toISOString());

console.log('\n🤖 COMO O CHATBOT ESTÁ FORMATANDO:');
console.log('toLocaleDateString pt-BR:', sampleDate.toLocaleDateString('pt-BR'));
console.log('toLocaleTimeString pt-BR:', sampleDate.toLocaleTimeString('pt-BR', { 
  hour: '2-digit', 
  minute: '2-digit'
}));

console.log('\n💻 COMO O FRONTEND DEVERIA ESTAR FORMATANDO:');
console.log('toLocaleDateString sem timezone:', sampleDate.toLocaleDateString('pt-BR'));
console.log('toLocaleTimeString sem timezone:', sampleDate.toLocaleTimeString('pt-BR', { 
  hour: '2-digit', 
  minute: '2-digit'
}));

console.log('\n🌍 INFORMAÇÕES DO SISTEMA:');
console.log('Timezone atual:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset UTC:', sampleDate.getTimezoneOffset(), 'minutos');

console.log('\n📊 COMPARAÇÃO:');
console.log('UTC:', sampleDate.getUTCHours() + ':' + sampleDate.getUTCMinutes().toString().padStart(2, '0'));
console.log('Local:', sampleDate.getHours() + ':' + sampleDate.getMinutes().toString().padStart(2, '0'));

// Teste com outras datas do banco
const testDates = [
  '2025-04-01T02:00:00.000Z', // 02:00 UTC
  '2025-05-05T23:00:00.000Z', // 23:00 UTC  
  '2025-04-06T21:30:00.000Z', // 21:30 UTC
  '2025-04-20T23:30:00.000Z', // 23:30 UTC
];

console.log('\n🧪 TESTE COM VÁRIAS DATAS DO BANCO:');
testDates.forEach((dateStr, i) => {
  const date = new Date(dateStr);
  console.log(`\nTeste ${i+1}: ${dateStr}`);
  console.log(`  UTC: ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`);
  console.log(`  Local: ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
  console.log(`  toLocaleTimeString: ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
}); 