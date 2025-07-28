-- Adicionar campo role na tabela users
-- Execute este script diretamente no PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
        
        -- Adicionar comentário
        COMMENT ON COLUMN users.role IS 'Role do usuário: admin, user, amateur';
        
        -- Atualizar usuários existentes
        UPDATE users SET role = 'admin' WHERE is_admin = true;
        UPDATE users SET role = 'user' WHERE is_admin = false AND role IS NULL;
        
        RAISE NOTICE 'Campo role adicionado na tabela users com sucesso';
    ELSE
        RAISE NOTICE 'Campo role já existe na tabela users';
    END IF;
END $$; 