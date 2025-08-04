-- =====================================================
-- SCRIPT: Criar usuário administrador se não existir
-- Execute ANTES da migração das tabelas de bolão se não houver usuários
-- =====================================================

-- Verificar se existem usuários
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        -- Criar usuário administrador padrão
        INSERT INTO users (
            name,
            email,
            password_hash,
            phone_number,
            role,
            origin,
            created_at,
            updated_at
        ) VALUES (
            'Administrador',
            'admin@kmiza27.com',
            '$2b$10$dummy.hash.for.admin.user', -- Hash dummy - deve ser alterado
            '11999999999',
            'admin',
            'site',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Usuário administrador criado: admin@kmiza27.com';
        RAISE NOTICE 'IMPORTANTE: Altere a senha do usuário administrador!';
    ELSE
        RAISE NOTICE 'Já existem % usuários na tabela. Nenhum usuário foi criado.', user_count;
    END IF;
END $$;

-- Listar usuários existentes
SELECT 
    id,
    name,
    email,
    role,
    origin,
    created_at
FROM users 
ORDER BY id;

-- =====================================================
-- Comandos úteis para gerenciar usuários:
-- =====================================================

-- Para alterar senha do admin (substitua 'nova_senha_hash'):
-- UPDATE users SET password_hash = 'nova_senha_hash' WHERE email = 'admin@kmiza27.com';

-- Para criar outro usuário manualmente:
-- INSERT INTO users (name, email, password_hash, phone_number, role, origin) 
-- VALUES ('Nome', 'email@example.com', 'hash_da_senha', '11999999999', 'user', 'site');