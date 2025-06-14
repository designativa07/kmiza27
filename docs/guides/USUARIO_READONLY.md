# 🔐 Usuário Readonly para Banco Kmiza27

Este documento explica como criar e usar um usuário com permissões apenas de leitura para o banco de dados `kmiza27`.

## 📋 Arquivos Criados

- `create-readonly-user.sql` - Script SQL para criar o usuário
- `create-readonly-user.ps1` - Script PowerShell automatizado
- `USUARIO_READONLY.md` - Esta documentação

## 🚀 Como Usar

### Opção 1: Script PowerShell (Recomendado)

```powershell
# Execute o script PowerShell
.\create-readonly-user.ps1
```

O script irá:
1. Solicitar a senha do usuário administrador
2. Solicitar uma senha para o novo usuário readonly
3. Criar o usuário automaticamente
4. Configurar todas as permissões
5. Exibir informações de conexão

### Opção 2: SQL Manual

1. **Edite o arquivo SQL:**
   ```sql
   # Abra create-readonly-user.sql
   # Substitua 'sua_senha_aqui_123!' por uma senha segura
   ```

2. **Execute o SQL:**
   ```bash
   psql -h h4xd66.easypanel.host -p 5432 -U postgres -d postgres -f create-readonly-user.sql
   ```

## 🔒 Permissões do Usuário

### ✅ Permitido
- **SELECT** em todas as tabelas existentes e futuras
- **SELECT** em todas as sequências (IDs auto-incremento)
- **CONNECT** ao banco `kmiza27`
- **USAGE** do schema `public`

### ❌ Bloqueado
- **INSERT, UPDATE, DELETE** (modificação de dados)
- **CREATE, DROP, ALTER** (modificação de estrutura)
- **GRANT, REVOKE** (gerenciamento de permissões)
- **Funções administrativas** (backup, restore, etc.)

## 📝 Informações de Conexão

```
Host: h4xd66.easypanel.host
Port: 5432
Database: kmiza27
Username: kmiza27_readonly
Password: [a senha que você definiu]
```

### String de Conexão
```
postgresql://kmiza27_readonly:[sua_senha]@h4xd66.easypanel.host:5432/kmiza27
```

### Teste de Conexão
```bash
psql -h h4xd66.easypanel.host -p 5432 -U kmiza27_readonly -d kmiza27
```

## 🧪 Testando o Usuário

### Teste 1: Conexão e Leitura
```sql
-- Conectar com o usuário readonly
\c kmiza27 kmiza27_readonly

-- Testar leitura (deve funcionar)
SELECT COUNT(*) FROM teams;
SELECT COUNT(*) FROM matches;
SELECT COUNT(*) FROM competitions;
```

### Teste 2: Verificar Bloqueios
```sql
-- Estas operações devem falhar com erro de permissão:

-- Tentativa de inserção (deve falhar)
INSERT INTO teams (name) VALUES ('Teste');

-- Tentativa de atualização (deve falhar)
UPDATE teams SET name = 'Novo Nome' WHERE id = 1;

-- Tentativa de exclusão (deve falhar)
DELETE FROM teams WHERE id = 1;

-- Tentativa de criar tabela (deve falhar)
CREATE TABLE teste (id INT);
```

## 🔧 Gerenciamento do Usuário

### Verificar Permissões
```sql
-- Ver informações do usuário
SELECT usename, usesuper, usecreatedb, usecanlogin 
FROM pg_user 
WHERE usename = 'kmiza27_readonly';

-- Ver permissões em tabelas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'kmiza27_readonly'
ORDER BY table_name;
```

### Alterar Senha
```sql
-- Como administrador
ALTER USER kmiza27_readonly WITH PASSWORD 'nova_senha_segura';
```

### Remover Usuário (se necessário)
```sql
-- Revogar todas as permissões
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM kmiza27_readonly;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM kmiza27_readonly;
REVOKE USAGE ON SCHEMA public FROM kmiza27_readonly;
REVOKE CONNECT ON DATABASE kmiza27 FROM kmiza27_readonly;

-- Remover o usuário
DROP USER kmiza27_readonly;
```

## 🎯 Casos de Uso

### Para Desenvolvedores
- Acesso seguro para consultas e análises
- Desenvolvimento de relatórios
- Debugging sem risco de modificar dados

### Para Ferramentas de BI
- Conexão segura para dashboards
- Extração de dados para análises
- Integração com ferramentas de visualização

### Para Auditoria
- Acesso para verificação de dados
- Análise de logs e estatísticas
- Monitoramento sem interferência

## ⚠️ Considerações de Segurança

1. **Senha Forte**: Use uma senha complexa com pelo menos 12 caracteres
2. **Acesso Restrito**: Compartilhe as credenciais apenas com pessoas autorizadas
3. **Monitoramento**: Monitore o uso do usuário readonly
4. **Rotação**: Altere a senha periodicamente
5. **Princípio do Menor Privilégio**: O usuário tem apenas as permissões mínimas necessárias

## 📊 Tabelas Disponíveis para Consulta

O usuário readonly terá acesso de leitura a todas as tabelas, incluindo:

- `teams` - Times de futebol
- `matches` - Jogos e partidas
- `competitions` - Competições
- `standings` - Classificações
- `goals` - Gols marcados
- `cards` - Cartões (amarelo/vermelho)
- `channels` - Canais de transmissão
- `match_broadcasts` - Transmissões por jogo
- `users` - Usuários do sistema
- `bot_configs` - Configurações do bot

E todas as outras tabelas do sistema kmiza27. 