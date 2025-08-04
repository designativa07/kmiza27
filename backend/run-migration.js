const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para executar comandos SQL no banco
async function runSQLFile() {
    try {
        console.log('🔧 Executando migração do banco de dados...');
        
        // Ler o arquivo SQL
        const sqlFilePath = path.join(__dirname, 'database', 'migrations', 'fix-pools-conflict.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📁 Arquivo SQL carregado:', sqlFilePath);
        
        // Configurações do banco - usar as mesmas do projeto
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            username: process.env.DB_USERNAME || 'admin',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_DATABASE || 'kmiza27_db'
        };
        
        console.log('🗄️ Conectando no banco:', `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        
        // Tentar executar via npm se estiver instalado
        try {
            // Criar arquivo temporário com o SQL
            const tempFile = path.join(__dirname, 'temp-migration.sql');
            fs.writeFileSync(tempFile, sqlContent);
            
            // Executar usando npx se possível
            const command = `npx pg-admin -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f ${tempFile}`;
            
            console.log('⚡ Tentando executar via npx...');
            execSync(command, { stdio: 'inherit' });
            
            // Limpar arquivo temporário
            fs.unlinkSync(tempFile);
            
        } catch (npxError) {
            console.log('⚠️ npx não disponível, tentando alternativa...');
            
            // Alternativa: usar node-postgres se estiver disponível
            try {
                const { Client } = require('pg');
                
                const client = new Client({
                    host: dbConfig.host,
                    port: dbConfig.port,
                    user: dbConfig.username,
                    password: dbConfig.password,
                    database: dbConfig.database,
                });
                
                await client.connect();
                console.log('✅ Conectado ao banco via node-postgres');
                
                // Executar SQL
                await client.query(sqlContent);
                console.log('✅ Migração executada com sucesso!');
                
                await client.end();
                
            } catch (pgError) {
                console.error('❌ Erro ao executar via node-postgres:', pgError.message);
                console.log('\n💡 Execute manualmente no seu cliente PostgreSQL:');
                console.log(`   Host: ${dbConfig.host}`);
                console.log(`   Porta: ${dbConfig.port}`);
                console.log(`   Usuário: ${dbConfig.username}`);
                console.log(`   Banco: ${dbConfig.database}`);
                console.log(`   Arquivo: ${sqlFilePath}`);
                
                // Mostrar o conteúdo SQL para execução manual
                console.log('\n📋 Conteúdo SQL para executar manualmente:');
                console.log('=====================================');
                console.log(sqlContent.substring(0, 500) + '...');
                console.log('=====================================');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        process.exit(1);
    }
}

// Executar
runSQLFile().then(() => {
    console.log('🎉 Script finalizado!');
}).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});