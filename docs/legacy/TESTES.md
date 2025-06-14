# 🧪 Testes Automatizados

## 📋 Visão Geral

O projeto Kmiza27 utiliza Jest como framework de testes, com suporte a testes unitários, de integração e end-to-end.

## 🏗️ Estrutura de Testes

```
tests/
├── auth.test.ts        # Testes de autenticação
├── chatbot.test.ts     # Testes do chatbot
├── setup.ts           # Configuração global
└── e2e/               # Testes end-to-end
    └── app.e2e-spec.ts
```

## 🚀 Executando Testes

### Testes Unitários

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm run test:auth
npm run test:chatbot

# Modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Testes End-to-End

```bash
# Executar testes e2e
npm run test:e2e
```

## 📊 Cobertura de Testes

O projeto mantém uma cobertura mínima de 80% para:
- Branches
- Funções
- Linhas
- Statements

## 🧩 Tipos de Testes

### Testes Unitários

- Serviços individuais
- Controladores
- Utilitários
- Helpers

### Testes de Integração

- Interação entre serviços
- Conexão com banco de dados
- Autenticação
- Webhooks

### Testes End-to-End

- Fluxos completos
- Interface do usuário
- Integração com serviços externos

## 🔧 Configuração

### Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Ambiente de Teste

```env
# .env.test
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=kmiza27_test
DATABASE_PASSWORD=kmiza27_test_password
DATABASE_NAME=kmiza27_test_db
JWT_SECRET=test_jwt_secret
JWT_EXPIRES_IN=1h
```

## 📝 Boas Práticas

1. **Nomenclatura**
   - Use descrições claras
   - Siga o padrão `describe`/`it`
   - Agrupe testes relacionados

2. **Organização**
   - Um arquivo de teste por módulo
   - Setup/teardown adequados
   - Mocks quando necessário

3. **Assertions**
   - Use assertions específicas
   - Verifique edge cases
   - Teste erros e exceções

4. **Manutenção**
   - Mantenha testes atualizados
   - Remova testes obsoletos
   - Documente casos especiais

## 🔄 CI/CD

Os testes são executados automaticamente:
- Em cada pull request
- Antes de cada deploy
- Diariamente (cron job)

## 📚 Recursos

- [Documentação Jest](https://jestjs.io/docs/getting-started)
- [Guia de Testes NestJS](https://docs.nestjs.com/fundamentals/testing)
- [Boas Práticas de Testes](https://martinfowler.com/bliki/TestPyramid.html) 