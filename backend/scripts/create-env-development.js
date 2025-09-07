const fs = require('fs');
const path = require('path');

console.log('🔧 Criando arquivo .env.development...');

const envContent = `# Configurações de Desenvolvimento
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=kmiza27_dev
DB_USERNAME=admin
DB_PASSWORD=password

# Configurações de Produção (para sincronização)
PROD_DB_HOST=h4xd66.easypanel.host
PROD_DB_PORT=5433
PROD_DB_DATABASE=kmiza27
PROD_DB_USERNAME=postgres
PROD_DB_PASSWORD=SUA_SENHA_DE_PRODUCAO_AQUI

# Configurações da API
API_BASE_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '..', '.env.development');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.development criado com sucesso!');
  console.log('📝 Lembre-se de substituir SUA_SENHA_DE_PRODUCAO_AQUI pela senha real do banco de produção');
} catch (error) {
  console.error('❌ Erro ao criar arquivo:', error.message);
}

