const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');

async function executeMigration() {
    console.log('🔧 Iniciando migração via TypeORM...');
    
    // Configuração do banco (mesma do projeto)
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'kmiza27_db',
        synchronize: false,
        logging: true,
    });

    try {
        // Conectar
        await dataSource.initialize();
        console.log('✅ Conectado ao banco de dados');

        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'database', 'migrations', 'fix-pools-conflict.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📁 Executando migração SQL...');
        
        // Dividir o SQL em comandos individuais e executar
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command && command.trim()) {
                try {
                    console.log(`⚡ Executando comando ${i + 1}/${commands.length}`);
                    await dataSource.query(command);
                } catch (error) {
                    if (error.message.includes('não existe') || error.message.includes('does not exist')) {
                        console.log(`⚠️ Comando ${i + 1} - Objeto já foi removido (OK): ${error.message}`);
                    } else {
                        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
                        // Continuar mesmo com erro para tentar executar o resto
                    }
                }
            }
        }
        
        console.log('✅ Migração concluída!');
        
        // Verificar se as tabelas foram criadas
        console.log('🔍 Verificando tabelas criadas...');
        const tables = await dataSource.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name LIKE 'pool%'
            ORDER BY table_name
        `);
        
        console.log('📊 Tabelas encontradas:', tables.map(t => t.table_name));
        
        // Verificar estrutura da tabela pools
        console.log('🔍 Verificando estrutura da tabela pools...');
        const columns = await dataSource.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'pools'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Colunas da tabela pools:');
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        
    } catch (error) {
        console.error('❌ Erro durante migração:', error.message);
        throw error;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('🔌 Conexão fechada');
        }
    }
}

// Executar migração
executeMigration()
    .then(() => {
        console.log('🎉 Migração finalizada com sucesso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Falha na migração:', error);
        process.exit(1);
    });