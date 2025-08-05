import { ScheduleModule } from '@nestjs/schedule';

// 🔧 CORREÇÃO CRYPTO: Garantir que o objeto crypto esteja disponível
// Necessário para o @nestjs/schedule funcionar corretamente em todos os ambientes
if (typeof globalThis.crypto === 'undefined') {
  try {
    const { webcrypto } = require('crypto');
    globalThis.crypto = webcrypto;
  } catch (error) {
    console.warn('⚠️ Aviso: Não foi possível carregar crypto globalmente:', error.message);
  }
}

export const scheduleConfig = ScheduleModule.forRoot(); 