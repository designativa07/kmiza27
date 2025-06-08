# =====================================================
# 🔧 SCRIPT PARA CRIAR USUÁRIO READONLY - KMIZA27 DB
# =====================================================

Write-Host "🔐 Criando usuário readonly para banco kmiza27..." -ForegroundColor Green

# Configurações do banco
$DB_HOST = "h4xd66.easypanel.host"
$DB_PORT = "5432"
$DB_NAME = "kmiza27"
$DB_ADMIN_USER = "postgres"  # ou o usuário admin que você usa
$READONLY_USER = "kmiza27_readonly"

# Solicitar senha do admin
Write-Host "📝 Digite a senha do usuário administrador ($DB_ADMIN_USER):" -ForegroundColor Yellow
$ADMIN_PASSWORD = Read-Host -AsSecureString
$ADMIN_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ADMIN_PASSWORD))

# Solicitar senha para o novo usuário readonly
Write-Host "📝 Digite a senha para o novo usuário readonly ($READONLY_USER):" -ForegroundColor Yellow
$READONLY_PASSWORD = Read-Host -AsSecureString
$READONLY_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($READONLY_PASSWORD))

# Criar arquivo SQL temporário com a senha
$SQL_CONTENT = @"
-- Criar usuário readonly
CREATE USER $READONLY_USER WITH PASSWORD '$READONLY_PASSWORD_TEXT';

-- Conceder permissões básicas
GRANT CONNECT ON DATABASE $DB_NAME TO $READONLY_USER;

-- Conectar ao banco para configurar permissões de schema
\c $DB_NAME;

-- Configurar permissões de leitura
GRANT USAGE ON SCHEMA public TO $READONLY_USER;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO $READONLY_USER;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO $READONLY_USER;

-- Configurar permissões padrão para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO $READONLY_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO $READONLY_USER;

-- Verificar criação
SELECT 'Usuário criado com sucesso!' as status;
SELECT usename, usesuper, usecreatedb, usecanlogin FROM pg_user WHERE usename = '$READONLY_USER';
"@

# Salvar SQL em arquivo temporário
$TEMP_SQL = "temp_create_readonly.sql"
$SQL_CONTENT | Out-File -FilePath $TEMP_SQL -Encoding UTF8

try {
    Write-Host "🚀 Executando criação do usuário..." -ForegroundColor Cyan
    
    # Definir variável de ambiente para senha
    $env:PGPASSWORD = $ADMIN_PASSWORD_TEXT
    
    # Executar SQL
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_ADMIN_USER -d postgres -f $TEMP_SQL 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Usuário readonly criado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Informações de conexão:" -ForegroundColor Yellow
        Write-Host "Host: $DB_HOST"
        Write-Host "Port: $DB_PORT"
        Write-Host "Database: $DB_NAME"
        Write-Host "Username: $READONLY_USER"
        Write-Host "Password: [a senha que você definiu]"
        Write-Host ""
        Write-Host "🔗 String de conexão:"
        Write-Host "postgresql://${READONLY_USER}:[senha]@${DB_HOST}:${DB_PORT}/${DB_NAME}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🧪 Teste de conexão:"
        Write-Host "psql -h $DB_HOST -p $DB_PORT -U $READONLY_USER -d $DB_NAME" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao criar usuário:" -ForegroundColor Red
        Write-Host $result
    }
} catch {
    Write-Host "❌ Erro ao executar script: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpar arquivo temporário
    if (Test-Path $TEMP_SQL) {
        Remove-Item $TEMP_SQL -Force
    }
    
    # Limpar variável de ambiente
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🔒 Permissões do usuário readonly:" -ForegroundColor Yellow
Write-Host "✅ SELECT em todas as tabelas"
Write-Host "✅ SELECT em todas as sequências"
Write-Host "✅ Conexão ao banco $DB_NAME"
Write-Host "❌ INSERT, UPDATE, DELETE (bloqueado)"
Write-Host "❌ CREATE, DROP, ALTER (bloqueado)"
Write-Host "❌ Permissões administrativas (bloqueado)" 