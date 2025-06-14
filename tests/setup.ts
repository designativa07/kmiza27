import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega variáveis de ambiente de teste
config({ path: resolve(__dirname, '../.env.test') });

// Configuração global para testes
beforeAll(async () => {
  // Setup global antes de todos os testes
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Cleanup global após todos os testes
});

// Configuração para cada teste
beforeEach(async () => {
  // Setup antes de cada teste
});

afterEach(async () => {
  // Cleanup após cada teste
});

// Extensão do timeout para testes que podem demorar mais
jest.setTimeout(30000); 